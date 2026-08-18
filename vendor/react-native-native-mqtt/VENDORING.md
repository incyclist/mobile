# Vendored: `@fdfedin/react-native-native-mqtt@0.1.12`

> **This is a temporary stopgap, not the long-term fix.** See "Where this is going" below.

> **Do not clone, fork, or depend on this directory from outside this repo.** It exists
> solely to keep `mobile`'s own `npm ci` working while item #58 (the real fix) is built.
> It will be deleted once that lands — do not build anything new on top of it, and do not
> treat it as a maintained package.

This directory is a copy of `@fdfedin/react-native-native-mqtt@0.1.12` exactly as it was
installed in `mobile/node_modules`, with build artefacts removed. It is consumed via
`"@fdfedin/react-native-native-mqtt": "file:vendor/react-native-native-mqtt"` in
`mobile/package.json`.

The package **name is deliberately unchanged**, so every existing import
(`mobile/src/bindings/mq/index.ts`) keeps working with no code changes anywhere else.
Nothing outside `package.json`, `package-lock.json` and this directory was touched.

## Why this is in-tree

On 2026-08-18 the upstream package was **fully unpublished from npm** — not just the
version we pinned. `npm view @fdfedin/react-native-native-mqtt` 404s on the bare package
name. This broke `npm ci` for every open `mobile` PR (see `FIXES_BACKLOG.md` item #57).

The source is not recoverable either:

- The package's own `repository.url` points at `github.com/Podmenato/rn-native-mqtt`,
  a fork that **no longer exists on GitHub** (404). That fork, not the `homepage`, is
  what 0.1.12 was actually built from (per `CHANGELOG.md`:
  `0.1.12 (2024-11-12) - Bug Fixes: update to latest env-keystore`).
- The original `davesters/rn-native-mqtt` repo still exists, but its published npm
  package (`react-native-native-mqtt`) tops out at **0.1.8** — older, and missing the
  `env-keystore` fix above, which touches TLS keystore handling.

The copy in `mobile/node_modules` was the only surviving instance of this exact build,
so it was committed here before it could be lost to a clean reinstall.

Vendoring keeps the exact native code that is already running on users' devices, so this
change carries no behavioural risk — the same built artefact is simply sourced locally
instead of from the registry.

## Where this is going

Vendoring pins us to unmaintained, frozen code indefinitely, and we now own native
Android/iOS source we did not write. The real fix is a separate, larger initiative:
**drop native MQTT entirely and move to MQTT.js over a TLS WebSocket**, spanning

- `infra` — enable RabbitMQ's `rabbitmq_web_mqtt` plugin and add a Traefik `wss://`
  route, mirroring the existing TLS-terminated `mqtts://` setup
  (`infra/ansible/roles/helm/rabbitmq/templates/`, `.../traefik/templates/values.yml`)
- `mobile` — replace `MessageQueue`'s native client with MQTT.js

That work is tracked separately and is **not** what this directory is for. Do not invest
in improving the vendored code beyond keeping it building.

## The `patch-package` patch is now baked in

`patches/@fdfedin+react-native-native-mqtt+0.1.12.patch` has been **deleted**. This copy
was taken from an already-patched `node_modules`, so the patch's substantive changes to
`android/build.gradle` are already part of the files here:

- `jcenter()` → `mavenCentral()` in `buildscript.repositories` (jcenter is shut down)
- dropped `buildToolsVersion = DEFAULT_BUILD_TOOLS_VERSION` (stale 28.0.3)
- dropped the whole `afterEvaluate { … }` block, whose javadoc/sources-jar tasks used
  the `Upload` task type that Gradle 8 removed

Retaining the patch file would have made `patch-package` try to apply it a second time —
and, because `node_modules/@fdfedin/react-native-native-mqtt` is now a **symlink into
this directory**, a successful re-apply would have edited committed source in place.
Future changes to this package are made by editing the files here directly.

## Local modifications

Beyond the baked-in patch above, only `package.json` differs from the published tarball:

- `private: true` added, to guard against accidental publication.
- `repository`, `scripts` and `devDependencies` removed — they referenced the deleted
  fork and a TypeScript build whose sources were never shipped in the tarball
  (only the compiled `lib/` and `types/` are published).
- `description` and `title` note the vendored status.

Everything else — `lib/`, `types/`, `android/`, `ios/`, the podspec — is untouched
upstream code. Note that only compiled JS is shipped; there is no TypeScript source
to edit. Native changes must be made in `android/src/` and `ios/` directly.

## Removed from the copy

`android/build/` (548K of Gradle output), `android/gradlew*`, and `.travis.yml`.

## Licence

MIT, see `LICENSE.md`. `ios/Libraries/` bundles CocoaMQTT, CocoaAsyncSocket and
Starscream sources, which carry their own MIT licences upstream.
