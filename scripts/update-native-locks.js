'use strict'

// Regenerates every dependency lock file that the native (Android/iOS) build
// relies on. Run this whenever a native dependency changes — an Android
// Gradle Plugin/Kotlin/compileSdk bump in android/build.gradle, a new or
// upgraded React Native library with native code, or a Gemfile change.
//
// Gradle checks the resolved dependency versions against these lock files on
// every build and fails loudly if they drift, so the regenerated files must
// be committed in the same change as the dependency bump that required them.

const { spawnSync } = require('node:child_process')
const path = require('node:path')
const fs = require('node:fs')
const os = require('node:os')

const repoRoot = path.resolve(__dirname, '..')
const androidDir = path.join(repoRoot, 'android')
const isWindows = os.platform() === 'win32'

function run(cmd, args, cwd) {
    console.log(`\n> ${cmd} ${args.join(' ')}  (in ${path.relative(repoRoot, cwd) || '.'})`)
    return spawnSync(cmd, args, { cwd, stdio: 'inherit', shell: isWindows })
}

function commandExists(cmd) {
    const checker = isWindows ? 'where' : 'which'
    return spawnSync(checker, [cmd], { stdio: 'ignore', shell: isWindows }).status === 0
}

let failed = false

console.log('== Android: regenerating Gradle dependency locks ==')
const hasAndroidSdk = process.env.ANDROID_HOME
    || process.env.ANDROID_SDK_ROOT
    || fs.existsSync(path.join(androidDir, 'local.properties'))

if (!hasAndroidSdk) {
    console.warn('  Skipped: no Android SDK found (ANDROID_HOME/ANDROID_SDK_ROOT unset, no android/local.properties).')
    console.warn('  Set up the Android SDK, then re-run this script to regenerate the Gradle lock files.')
} else {
    const gradlew = isWindows ? 'gradlew.bat' : './gradlew'
    // A single `:app:dependencies` run resolves the app module's configurations
    // *and* — because Gradle resolves buildscript/settings classpaths during
    // the configuration phase regardless of the task requested — the root
    // buildscript classpath and the settings script classpath too. So one
    // command regenerates all three files below.
    const result = run(gradlew, [':app:dependencies', '--write-locks'], androidDir)
    if (result.status !== 0) {
        console.error('  Gradle lock regeneration failed — see output above.')
        failed = true
    } else {
        console.log('  Updated android/buildscript-gradle.lockfile, android/settings-gradle.lockfile and android/app/gradle.lockfile')
    }
}

console.log('\n== iOS: regenerating Gemfile.lock ==')
if (!commandExists('bundle')) {
    console.warn('  Skipped: `bundle` is not on PATH. Gemfile.lock only needs regenerating after a Gemfile change,')
    console.warn('  and is normally done on macOS. Install with `gem install bundler`, then re-run this script.')
} else {
    const result = run('bundle', ['lock'], repoRoot)
    if (result.status !== 0) {
        console.error('  Gemfile.lock regeneration failed — see output above.')
        failed = true
    } else {
        console.log('  Updated Gemfile.lock')
    }
}

console.log(failed
    ? '\nOne or more lock files failed to regenerate — see errors above.'
    : '\nDone. Review the diff and commit the updated lock files alongside the dependency change.')

process.exit(failed ? 1 : 0)
