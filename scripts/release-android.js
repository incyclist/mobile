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

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');
const prompts = require('prompts');

const REPO_ROOT = path.join(__dirname, '..');
const SERVICES_DIR = path.join(REPO_ROOT, '..', 'services');
const DEVICES_DIR = path.join(REPO_ROOT, '..', 'devices');

// Resolves an executable to an absolute path once at startup, rather than letting every
// execFileSync call re-resolve a bare command name against PATH — a writable early PATH entry
// could otherwise shadow git/gh/claude with something else entirely. The `which`/`where` lookup
// itself is pinned to its well-known, fixed OS location so that bootstrap step isn't itself
// PATH-dependent.
function resolveBin(name) {
    const finder = process.platform === 'win32' ? String.raw`C:\Windows\System32\where.exe` : '/usr/bin/which';
    try {
        return execFileSync(finder, [name], { encoding: 'utf8' }).trim().split(/\r?\n/)[0];
    } catch {
        return null;
    }
}

const GIT_BIN = resolveBin('git');
const GH_BIN = resolveBin('gh');
const CLAUDE_BIN = resolveBin('claude');

if (!GIT_BIN) {
    console.error('❌ "git" not found on PATH.');
    process.exit(1);
}
if (!GH_BIN) {
    console.error('❌ "gh" (GitHub CLI) not found on PATH — required to trigger the release workflow.');
    process.exit(1);
}

const onCancel = () => {
    console.log('Aborted.');
    process.exit(1);
};

// Only real git refs/SHAs are ever expected here. Rejecting a leading '-' stops a value —
// especially the free-typed "enter a commit or ref manually" input — from being interpreted as
// a git/CLI flag instead of a revision.
function isSafeRefFormat(ref) {
    return typeof ref === 'string' && ref.length > 0 && !ref.startsWith('-');
}

function refExists(dir, ref) {
    if (!isSafeRefFormat(ref)) return false;
    try {
        execFileSync(GIT_BIN, ['rev-parse', '--verify', '--quiet', `${ref}^{commit}`], { cwd: dir, stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
}

function git(args, options = {}) {
    return execFileSync(GIT_BIN, args, { cwd: REPO_ROOT, encoding: 'utf8', ...options }).trim();
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
    if (!/^\w[\w./-]*(\.\.\w[\w./-]*)?$/.test(range)) {
        throw new Error(`Refusing to use unsafe git log range: ${JSON.stringify(range)}`);
    }
    return execFileSync(GIT_BIN, ['log', range, '--oneline'], { cwd: dir, encoding: 'utf8' }).trim();
}

function cleanSemver(v) {
    if (!v) return null;
    const stripped = v.replace(/^[\^~]/, '');
    // Only ever used to build a `v<version>` tag name passed to git commands — reject anything
    // that doesn't look like a plain semver so a malformed/hostile package.json entry can't turn
    // into an unexpected CLI argument.
    return /^\d+\.\d+\.\d+$/.test(stripped) ? stripped : null;
}

function depVersionAt(dir, ref, depName) {
    try {
        if (!/^\w[\w./-]*$/.test(ref)) {
            throw new Error(`Refusing to use unsafe git ref: ${JSON.stringify(ref)}`);
        }
        const content = execFileSync(GIT_BIN, ['show', `${ref}:package.json`], { cwd: dir, encoding: 'utf8' });
        const pkg = JSON.parse(content);
        return cleanSemver(pkg.dependencies?.[depName]);
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
function formatSection(title, body) {
    return `## ${title}\n${body}`;
}

// Tries to append one library's commit log for a detected version bump; on failure, appends a
// section explaining what couldn't be read instead of throwing (a cross-repo checkout being
// unavailable/stale shouldn't abort drafting mobile's own notes).
function appendLibrarySection(sections, dir, label, oldTag, newTag) {
    try {
        const log = gitLog(dir, `${oldTag}..${newTag}`);
        sections.push(formatSection(`${label} commits (${oldTag}..${newTag})`, log || '(none)'));
    } catch (err) {
        sections.push(formatSection(`${label} commits`, `(could not read: ${err.message})`));
    }
}

function gatherContext(baseRef) {
    const range = baseRef ? `${baseRef}..HEAD` : 'HEAD';
    const mobileTitle = baseRef ? `mobile commits since ${baseRef}` : 'mobile commits (full history — no prior release tag exists)';
    const sections = [formatSection(mobileTitle, gitLog(REPO_ROOT, range) || '(none)')];

    if (!baseRef) return sections.join('\n\n');

    const servicesBump = detectBump(REPO_ROOT, 'incyclist-services', baseRef, 'HEAD');
    if (!servicesBump || !fs.existsSync(SERVICES_DIR)) return sections.join('\n\n');

    const oldTag = `v${servicesBump.oldVer}`;
    const newTag = `v${servicesBump.newVer}`;
    appendLibrarySection(sections, SERVICES_DIR, 'incyclist-services', oldTag, newTag);

    const devicesBump = detectBump(SERVICES_DIR, 'incyclist-devices', oldTag, newTag);
    if (devicesBump && fs.existsSync(DEVICES_DIR)) {
        const oldDTag = `v${devicesBump.oldVer}`;
        const newDTag = `v${devicesBump.newVer}`;
        appendLibrarySection(sections, DEVICES_DIR, 'incyclist-devices', oldDTag, newDTag);
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

function draftWithClaude(baseRef, appVersion) {
    const context = gatherContext(baseRef);
    const prompt = buildDraftPrompt(context, appVersion);

    console.log('Drafting release notes with Claude...');
    try {
        if (!/^[^-]/.test(prompt)) {
            throw new Error('Refusing to use unsafe claude prompt: starts with "-"');
        }
        // No --add-dir / tool use needed — the prompt is self-contained text, so this is a
        // single-shot generation, not a multi-turn agentic session. The `--` marker forces the
        // prompt to be treated as a plain positional value, not re-parsed as flags, regardless
        // of its content (it's built from commit log text, not written by hand).
        return execFileSync(CLAUDE_BIN, ['-p', '--model', 'sonnet', '--', prompt], {
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
        {
            type: 'text',
            name: 'manualRef',
            message: 'Commit SHA or ref',
            validate: (value) => {
                if (!isSafeRefFormat(value)) return 'Must be a valid ref (cannot start with "-")';
                if (!refExists(REPO_ROOT, value)) return `"${value}" does not resolve to a commit in this repo`;
                return true;
            },
        },
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
    if (CLAUDE_BIN) {
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
    // appVersion ends up in a git tag name and a `gh workflow run -f` argument — validate its
    // shape before it's used anywhere rather than trusting app.json content blindly.
    if (!/^\d+\.\d+\.\d+$/.test(appVersion)) {
        throw new Error(`app.json's appVersion ("${appVersion}") is not a plain semver string.`);
    }

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
        if (!/^\d+$/.test(String(rollout))) {
            throw new Error(`Refusing to use unsafe rollout: ${JSON.stringify(rollout)}`);
        }
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
    if (!/^\w[\w-]*$/.test(track)) {
        throw new Error(`Refusing to use unsafe track: ${JSON.stringify(track)}`);
    }
    if (tagName && !/^[\w./-]+$/.test(tagName)) {
        throw new Error(`Refusing to use unsafe releaseTag: ${JSON.stringify(tagName)}`);
    }
    if (rollout !== null && !/^\d+$/.test(String(rollout))) {
        throw new Error(`Refusing to use unsafe rollout: ${JSON.stringify(rollout)}`);
    }
    execFileSync(GH_BIN, ghArgs, { cwd: REPO_ROOT, stdio: 'inherit' });

    console.log('\nTriggered. Track progress with: gh run list --workflow=upload-google-play.yml');
}

main().catch((err) => {
    console.error(`\n❌ ${err.message}`);
    process.exit(1);
});
