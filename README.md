# Incyclist Mobile

A React Native cycling training app that allows cyclists to ride virtual routes with real-time sensors. Supports iOS and Android.

---

## Prerequisites

- Node.js 22+
- React Native development environment — follow the [official setup guide](https://reactnative.dev/docs/set-up-your-environment)
- For iOS: macOS with Xcode and CocoaPods
- For Android: Android Studio with SDK

---

## Build variants

The app has three build variants:

**`debug`** — Development build that requires Metro to be running. Supports hot reload and React Native dev tools. Best for active development.

**`dev`** — Standalone build that installs and runs without Metro. If local builds of `incyclist-services` or `incyclist-devices` are present they are used automatically, otherwise the published npm versions are used. Best for testing a complete build on a device.

**`release`** — Production build. Requires device attestation (Apple App Attest on iOS, Google Play Integrity on Android) and a running secrets microservice. Required for App Store / Play Store distribution.

For forking and sideloading, use **`dev`** or **`debug`**. Attestation is disabled in both — secrets are provided locally in `settings.json` instead.

---

## Repository layout

For active development, check out the following repositories as siblings:

```sh
git clone https://github.com/incyclist/services.git
git clone https://github.com/incyclist/devices.git
git clone https://github.com/incyclist/mobile.git
```

Your directory layout should look like this:

```
├── services/
├── devices/
└── mobile/
```

When running a `dev` or `debug` build, Metro automatically picks up local builds of `incyclist-services` and `incyclist-devices` from these sibling directories if they exist. This allows you to develop and test changes across all three repos simultaneously without publishing to npm.

If you only want to work on the mobile app itself, you only need the `mobile` repo — the published npm versions of `incyclist-services` and `incyclist-devices` will be used.

---

## Getting started

### 1. Install dependencies

```sh
cd mobile
npm install
```

### 2. Create `config/config.json`

This file is gitignored and must be created manually. A template is at `config/config.example.json`.

```json
{
  "GOOGLE_PROJECT_NUMBER": "<your Google Cloud project number>"
}
```

This is only required for release builds. For `dev` and `debug` you can leave it empty (`{}`).

### 3. Create your settings file

Create `config/dev/settings.json` (or `config/debug/settings.json` for debug builds). This file provides secrets and configuration directly to the app — no secrets microservice needed.

```json
{
  "MQ_BROKER": "mqtts://your-mqtt-broker.example.com",
  "MQ_USER": "your-mqtt-username",
  "MQ_PASSWORD": "your-mqtt-password",
  "INCYCLIST_API_KEY": "your-api-key"
}
```

You can add any additional key-value pairs here that your app needs, for example a `uuid` for uniquely identifying the user across runs.

> **Note:** `INCYCLIST_API_KEY` is required to connect to the Incyclist backend. Contact the Incyclist team to obtain a valid key. Without it, calls to the Incyclist backend will fail — but you can still run the app against your own backend.

The release build will not process the settings files as settings will be provided by the Incyclist backend after successfully performing device attestation (i.e. verifying that the app was installed through play store / app store)

### 4. iOS only — install CocoaPods

```sh
cd ios && bundle install && bundle exec pod install && cd ..
```

---

## Running the app

### Debug build (requires Metro)

First start Metro:

```sh
npm start:debug
```

Then in a separate terminal:

```sh
# Android
npm run debug:android

# iOS
npm run ios
```

### Dev build (standalone)

```sh
# Android
npm run dev:android

# iOS — build and run from Xcode, selecting the 'dev' scheme
```

### Release build

See [Release builds](#release-builds) below — additional setup required.

---

## Release builds

Release builds require device attestation and a deployed secrets microservice. This is not needed for local development or sideloading.

### What you need

**Google Play Integrity (Android)**
1. Create a Google Cloud project and enable the Play Integrity API
2. Link the project to your app in Google Play Console → Setup → App integrity
3. Note the project **number** — this goes in `config/config.json` as `GOOGLE_PROJECT_NUMBER`
4. Create a service account with Play Integrity API access, download the JSON key — required by the secrets microservice

**Apple App Attest (iOS)**
1. Enable the App Attest capability for your App ID in the Apple Developer portal
2. Note your Team ID and bundle identifier — configured on the secrets microservice as `APPLE_TEAM_ID` and `APPLE_APP_ID`

**Secrets microservice**

Deploy the secrets microservice from the `incyclist/microservices` repository. See that repo's README for full deployment instructions.

After deploying, seed the store with your secrets via the admin API — the secrets will then be distributed to the app after successful attestation on each device.

---

## Troubleshooting

If you're having issues getting the above steps to work, see the React Native [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.