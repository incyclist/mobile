#!/usr/bin/env node
/**
 * Interactive Android release flow: optionally drafts Google Play "what's new"
 * text, tags the release (the tag doubles as the notes' storage AND as the
 * "last documented Android release" marker for the next draft's commit
 * range), then triggers the upload-google-play GitHub workflow.
 *
 * app.json's version fields are NOT touched here — bumping appVersion /
 * bundleVersion / androidVersionCode stays a separate, manual step done
 * before running this script.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');
const prompts = require('prompts');

const REPO_ROOT = path.join(__dirname, '..');
const SERVICES_DIR = path.join(REPO_ROOT, '..', 'services');
const DEVICES_DIR = path.join(REPO_ROOT, '..', 'devices');

const onCancel = () => {
    console.log('Aborted.');
    process.exit(1);
};

function git(args, options = {}) {
    return execFileSync('git', args, { cwd: REPO_ROOT, encoding: 'utf8', ...options }).trim();
}

function listTags() {
    // All tags, not just android-release/* — that convention won't have any entries until this
    // tooling has actually been used once, but existing tags (v1.1.1, bundle/v0.3.1, ...) are
    // still meaningful starting points to diff from.
    const out = git([
        'for-each-ref',
        'refs/tags',
        '--sort=-creatordate',
        '--count=50',
        '--format=%(refname:short)|%(creatordate:relative)',
    ]);
    if (!out) return [];
    return out.split('\n').map((line) => {
        const [tag, relativeDate] = line.split('|');
        return { tag, relativeDate };
    });
}

function gitLog(dir, range) {
    return execFileSync('git', ['log', range, '--oneline'], { cwd: dir, encoding: 'utf8' }).trim();
}

function cleanSemver(v) {
    return v ? v.replace(/^[\^~]/, '') : null;
}

function depVersionAt(dir, ref, depName) {
    try {
        const content = execFileSync('git', ['show', `${ref}:package.json`], { cwd: dir, encoding: 'utf8' });
        const pkg = JSON.parse(content);
        return cleanSemver(pkg.dependencies && pkg.dependencies[depName]);
    } catch {
        return null;
    }
}

function detectBump(dir, depName, oldRef, newRef) {
    const oldVer = depVersionAt(dir, oldRef, depName);
    const newVer = depVersionAt(dir, newRef, depName);
    if (oldVer && newVer && oldVer !== newVer) return { oldVer, newVer };
    return null;
}

// Pre-gathers everything the drafting prompt needs as plain text: mobile's own commit log,
// plus — if package.json shows incyclist-services was bumped in this range — that library's
// own commit log for the version range, recursing one level further into incyclist-devices if
// services itself bumped that. All local git commands, so this is near-instant. Handing Claude
// pre-assembled text instead of instructing it to go run these commands itself turns the draft
// call into a single-shot text generation with no tool-use round trips.
function gatherContext(baseRef) {
    const range = baseRef ? `${baseRef}..HEAD` : 'HEAD';
    const sections = [
        `## mobile commits ${baseRef ? `since ${baseRef}` : '(full history — no prior release tag exists)'}\n` +
        (gitLog(REPO_ROOT, range) || '(none)'),
    ];

    if (baseRef) {
        const servicesBump = detectBump(REPO_ROOT, 'incyclist-services', baseRef, 'HEAD');
        if (servicesBump && fs.existsSync(SERVICES_DIR)) {
            const oldTag = `v${servicesBump.oldVer}`;
            const newTag = `v${servicesBump.newVer}`;
            try {
                sections.push(
                    `## incyclist-services commits (${oldTag}..${newTag})\n` +
                    (gitLog(SERVICES_DIR, `${oldTag}..${newTag}`) || '(none)')
                );

                const devicesBump = detectBump(SERVICES_DIR, 'incyclist-devices', oldTag, newTag);
                if (devicesBump && fs.existsSync(DEVICES_DIR)) {
                    const oldDTag = `v${devicesBump.oldVer}`;
                    const newDTag = `v${devicesBump.newVer}`;
                    try {
                        sections.push(
                            `## incyclist-devices commits (${oldDTag}..${newDTag})\n` +
                            (gitLog(DEVICES_DIR, `${oldDTag}..${newDTag}`) || '(none)')
                        );
                    } catch (err) {
                        sections.push(`## incyclist-devices commits\n(could not read: ${err.message})`);
                    }
                }
            } catch (err) {
                sections.push(`## incyclist-services commits\n(could not read: ${err.message})`);
            }
        }
    }

    return sections.join('\n\n');
}

function buildDraftPrompt(context, appVersion) {
    return `You are drafting Google Play "What's New" release notes for the Incyclist
Android app (package com.incyclist.app), version ${appVersion}.

Below is the raw commit history relevant to this release — mobile's own
commits, plus (when applicable) the commits inside incyclist-services and/or
incyclist-devices covering any library version bump that landed in this
range. Do not run any commands, just work from the text below.

${context}

Task:
1. From all of the above, identify only genuinely user-facing changes: new
   features, visible fixes, meaningful reliability/performance improvements.
   Ignore refactors, tests, CI/build changes, and dependency bumps that don't
   themselves describe a user-facing effect.
2. Ignore anything clearly iOS-only that wouldn't be visible to an Android
   user — use judgment from commit messages, most RN code is shared so don't
   filter mechanically by file path.
3. Write the notes as a short bullet list, 3-5 lines, each starting with
   "- ", in plain language a non-technical rider would understand. No
   ticket/PR/issue numbers, no internal jargon, no references to internal
   docs or design files. Order: new features first, then improvements, then
   fixes.
4. Total output must fit within 500 characters. Trim lines if needed,
   dropping the least important first.
5. If nothing genuinely user-facing is found, output exactly:
   - Bug fixes and performance improvements
6. Output ONLY the bullet list — no preamble, no explanation, no code
   fences. It gets written directly into the whatsnew file.`;
}

function claudeInstalled() {
    try {
        execFileSync('which', ['claude'], { stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
}

function draftWithClaude(baseRef, appVersion) {
    const context = gatherContext(baseRef);
    const prompt = buildDraftPrompt(context, appVersion);

    console.log('Drafting release notes with Claude...');
    try {
        // No --add-dir / tool use needed — the prompt is self-contained text, so this is a
        // single-shot generation, not a multi-turn agentic session.
        return execFileSync('claude', ['-p', '--model', 'sonnet', prompt], {
            cwd: REPO_ROOT,
            encoding: 'utf8',
            timeout: 60 * 1000,
        }).trim();
    } catch (err) {
        console.warn(`⚠️  Claude drafting failed (${err.message}). Falling back to manual entry.`);
        return '';
    }
}

function editInEditor(initialContent) {
    const editor = process.env.EDITOR || process.env.VISUAL || 'nano';
    const tmpFile = path.join(os.tmpdir(), `incyclist-whatsnew-${Date.now()}.txt`);
    fs.writeFileSync(tmpFile, initialContent);
    try {
        const result = spawnSync(editor, [tmpFile], { stdio: 'inherit' });
        if (result.error) {
            throw new Error(`Could not launch editor "${editor}": ${result.error.message}`);
        }
        const content = fs.readFileSync(tmpFile, 'utf8').trim();

        if (content === '' || content.toLowerCase() === 'delete') {
            return null;
        }

        console.log('\n--- Draft release notes ---');
        console.log(content);
        console.log('----------------------------\n');

        return content;
    } finally {
        fs.rmSync(tmpFile, { force: true });
    }
}

async function pickBaseRef() {
    const tags = listTags();
    const choices = [
        ...tags.map(({ tag, relativeDate }) => ({ title: `${tag} (${relativeDate})`, value: tag })),
        { title: 'Full history (no base ref)', value: '__full__' },
        { title: 'Enter a commit or ref manually...', value: '__manual__' },
    ];

    const { choice } = await prompts(
        { type: 'select', name: 'choice', message: 'Base ref to diff from', choices, initial: 0 },
        { onCancel }
    );

    if (choice === '__full__') return null;
    if (choice !== '__manual__') return choice;

    const { manualRef } = await prompts(
        { type: 'text', name: 'manualRef', message: 'Commit SHA or ref' },
        { onCancel }
    );
    return manualRef || null;
}

async function collectReleaseNotes(appVersion) {
    const { include } = await prompts(
        { type: 'confirm', name: 'include', message: 'Include release notes for this release?', initial: true },
        { onCancel }
    );
    if (!include) return null;

    const baseRef = await pickBaseRef();

    let draft = '';
    if (claudeInstalled()) {
        draft = draftWithClaude(baseRef, appVersion);
    } else {
        console.log('claude CLI not found — opening editor for manual entry.');
    }

    while (true) {
        const content = editInEditor(draft);
        if (content === null) {
            console.log('Release notes skipped (empty or "delete").');
            return null;
        }

        const { confirmed } = await prompts(
            { type: 'confirm', name: 'confirmed', message: 'Use these release notes?', initial: true },
            { onCancel }
        );
        if (confirmed) return content;

        draft = content; // reopen editor, starting from the last edit
    }
}

async function checkBranchSync(dryRun) {
    const currentBranch = git(['rev-parse', '--abbrev-ref', 'HEAD']);
    if (currentBranch !== 'main') {
        console.warn(
            `⚠️  You are on branch "${currentBranch}", not main. The GitHub workflow always builds ` +
            `from origin/main regardless of what is checked out locally.`
        );
    }

    git(['fetch', 'origin', 'main', '--quiet']);
    const localMain = git(['rev-parse', 'main']);
    const remoteMain = git(['rev-parse', 'origin/main']);
    if (localMain !== remoteMain) {
        console.warn(
            `⚠️  Local main (${localMain.slice(0, 7)}) differs from origin/main (${remoteMain.slice(0, 7)}). ` +
            `The release will be built from origin/main — push first if local changes should be included.`
        );
        if (dryRun) return;
        const { proceed } = await prompts(
            { type: 'confirm', name: 'proceed', message: 'Proceed anyway?', initial: false },
            { onCancel }
        );
        if (!proceed) onCancel();
    }
}

async function main() {
    const dryRun = process.argv.includes('--dry-run');
    if (dryRun) console.log('🧪 Dry run: no tag will be created/pushed, no workflow will be triggered.\n');

    const appJson = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'app.json'), 'utf8'));
    const appVersion = appJson.appVersion;

    const notes = await collectReleaseNotes(appVersion);

    let tagName = null;
    if (notes) {
        tagName = `android-release/v${appVersion}`;
        if (dryRun) {
            console.log(`[dry-run] Would tag and push ${tagName} with this message:\n${notes}\n`);
        } else {
            git(['tag', '-f', '-a', tagName, '-m', notes]);
            git(['push', '-f', 'origin', tagName]);
            console.log(`Tagged and pushed ${tagName}.`);
        }
    }

    const { track } = await prompts(
        {
            type: 'select',
            name: 'track',
            message: 'Release track',
            choices: [
                { title: 'production', value: 'production' },
                { title: 'open_testing', value: 'open_testing' },
                { title: 'closed_testing', value: 'closed_testing' },
            ],
            initial: 0,
        },
        { onCancel }
    );

    let rollout = null;
    if (track === 'production') {
        const res = await prompts(
            {
                type: 'number',
                name: 'rollout',
                message: 'Staged rollout percentage (1-100)',
                initial: 100,
                min: 1,
                max: 100,
            },
            { onCancel }
        );
        rollout = res.rollout;
    }

    await checkBranchSync(dryRun);

    const ghArgs = ['workflow', 'run', 'upload-google-play.yml', '--ref', 'main', '-f', `track=${track}`];
    if (track === 'production') ghArgs.push('-f', `rollout=${rollout}`);
    if (tagName) ghArgs.push('-f', `releaseTag=${tagName}`);

    if (dryRun) {
        console.log(`[dry-run] Would run: gh ${ghArgs.join(' ')}`);
        return;
    }

    console.log(`\nTriggering: gh ${ghArgs.join(' ')}\n`);
    execFileSync('gh', ghArgs, { cwd: REPO_ROOT, stdio: 'inherit' });

    console.log('\nTriggered. Track progress with: gh run list --workflow=upload-google-play.yml');
}

main().catch((err) => {
    console.error(`\n❌ ${err.message}`);
    process.exit(1);
});
