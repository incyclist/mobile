---
name: Native Code Change Workflow
description: Constraints and required workflow whenever a change touches native code, TurboModules, or native dependencies.
---

# Native Code Changes

Applies to: adding or updating a TurboModule (new/changed `.swift`, `.kt`, `.m`, or a codegen spec
in `src/specs`), adding or upgrading any native library (a package with iOS/Android native code,
not pure-JS), or any other edit under `ios/` or `android/` — including `project.pbxproj`,
`Podfile`, `build.gradle`, `settings.gradle`.

Check which machine you're actually running on before doing anything below — the required
workflow differs.

## `npm run update-native-locks` runs on both sides — split by platform

The script regenerates Android's Gradle lockfiles and iOS's `Gemfile.lock` in one run, but the two
halves belong to different machines: run it **on Linux** (where the Android SDK lives) to update
the Android lockfiles, and separately **on macOS** to update `Gemfile.lock` (it needs `bundle`,
which is only realistically set up there). Whenever a native dependency changes — added, removed,
or upgraded — both sides need a run and both sets of resulting lockfile changes get committed.
The script itself skips whichever half it can't do on the machine it's run on, so running it
without arguments on either side is safe.

## Running on macOS

The rest of the native toolchain is only available here. After making source edits, run what's
actually needed to verify them: `npm install`, `cd ios && pod install` (only if the Podfile,
Podfile.lock, or codegenConfig changed — don't do it defensively, see below), the iOS half of
`npm run update-native-locks`, and a real build. Commit any lock files the tooling regenerates
alongside the source change.

Two things to know before running `pod install`: it regenerates the Pods Xcode project/xcconfigs,
which can invalidate DerivedData's module cache and produce spurious errors on the *next* build
(`Unable to find module dependency`, missing std members) — these are cache artifacts, not real
compile errors; `rm -rf ~/Library/Developer/Xcode/DerivedData/Incyclist-*` clears them. And a
`git reset --hard` desyncs `Podfile.lock` from the already-installed Pods sandbox — only
`pod install` regenerates the lockfile, it can't be produced elsewhere.

## Running on Linux (or anywhere without the iOS toolchain)

You cannot run `pod install`, build the Xcode project, or regenerate `Gemfile.lock` — those only
work on macOS. Don't attempt them, and don't ask the user to hand-type the equivalent commands
themselves as a substitute either. The Android half is different: if `ANDROID_HOME` (or
`ANDROID_SDK_ROOT`, or `android/local.properties`) is present, run the Android half of
`npm run update-native-locks` yourself after a native dependency change and commit the regenerated
Gradle lockfiles alongside the source change — don't defer that to the Mac side.

1. Make all source-level edits normally (Swift/Kotlin/TS/JS, `project.pbxproj` entries,
   `package.json` dependency changes, etc.) — this part works fine here.
2. For anything that still needs the iOS toolchain (a real build, `pod install`, `Gemfile.lock`,
   on-device test), this repo already has an established, queue-based relay for running
   verification jobs on a Mac build machine — use that rather than improvising a manual checklist
   for the user. If its mechanics aren't already loaded in context, check this checkout's
   gitignored internal notes for the current process before assuming how it works.
3. Whatever can't be verified through that relay (a visual check, on-device behavior, something
   only a human can judge) — say so explicitly and describe exactly what to look for, rather than
   asking the user to run the whole workflow manually as a substitute.
4. Don't report a native-code task as done/mergeable until the iOS side has actually been verified
   on the Mac and its result is known — Linux-side source edits and Android lock regeneration
   alone are not a complete, working build.
