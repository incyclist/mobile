#!/bin/sh
#
# write-maps-key.sh — inject the Google Maps iOS API key into the built app.
#
# Run as an Xcode build phase, AFTER "Copy Bundle Resources", writing
# GMSApiKey.plist straight into the built product. Nothing has to exist in the
# repo and no file reference has to be added to the project, so there is no
# committed placeholder for a real key to be pasted into by accident.
#
# ── Key handling ──────────────────────────────────────────────────────────
#
# This script must never print the key. It goes onto a build log that is read,
# copied to shared drives and pasted into chat. An Artifactory token already
# escaped that way once during this feature's setup, via `npm -v` quoting
# .npmrc back on stderr.
#
# Two further requirements that live outside this file:
#
#   1. "Show environment variables in build log" must stay UNCHECKED on this
#      build phase. Xcode prints the entire environment when it is on, and
#      MAPS_API_KEY_IOS is in that environment by construction — which would
#      defeat everything below.
#   2. Tracing is disabled explicitly rather than assumed, since `set -x` would
#      echo the assignment itself.
#
set +x
set -u

APP_ENV_FILE="$SRCROOT/../.env"
PLIST_NAME="GMSApiKey.plist"

# ── Locate the key: environment first, then .env, mirroring the precedence in
#    android/app/build.gradle's getEnv ─────────────────────────────────────

KEY="${MAPS_API_KEY_IOS:-}"

if [ -z "$KEY" ] && [ -f "$APP_ENV_FILE" ]; then
    # grep/cut rather than sourcing: .env is not ours and may contain anything.
    KEY=$(grep -E '^[[:space:]]*MAPS_API_KEY_IOS[[:space:]]*=' "$APP_ENV_FILE" \
          | tail -1 \
          | cut -d= -f2- \
          | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
fi

# ── Release builds fail rather than ship silently broken ──────────────────
#
# Direct port of the gradle.taskGraph.whenReady guard in
# android/app/build.gradle, and it exists for exactly the reason that guard
# exists: a release build with an empty Maps key compiles, installs and
# initialises cleanly, then has every panorama request rejected. That shipped
# to production undetected for months on Android.

if [ -z "$KEY" ]; then
    if [ "${CONFIGURATION:-}" = "Release" ]; then
        echo "error: MAPS_API_KEY_IOS is not set. A Release build with no Maps API key" >&2
        echo "error: breaks Street View silently — black ride screen, no error anywhere." >&2
        echo "error: Set it in .env for local builds, or as the MAPS_API_KEY_IOS" >&2
        echo "error: repository secret wired into the workflow env for CI." >&2
        exit 1
    fi

    echo "warning: MAPS_API_KEY_IOS is not set — Street View will not work in this build."
    echo "warning: The component reports apiKey:missing in the app's event log."
    # Written anyway, empty: the native side then reports "missing" through the
    # event log rather than finding no file and having nothing to say.
    KEY=""
fi

# ── Write into the built product ──────────────────────────────────────────

TARGET_DIR="${BUILT_PRODUCTS_DIR:-}/${UNLOCALIZED_RESOURCES_FOLDER_PATH:-}"

if [ -z "${BUILT_PRODUCTS_DIR:-}" ] || [ -z "${UNLOCALIZED_RESOURCES_FOLDER_PATH:-}" ]; then
    echo "error: BUILT_PRODUCTS_DIR / UNLOCALIZED_RESOURCES_FOLDER_PATH unset —" >&2
    echo "error: this script must run as an Xcode build phase." >&2
    exit 1
fi

mkdir -p "$TARGET_DIR"
PLIST_PATH="$TARGET_DIR/$PLIST_NAME"

/usr/libexec/PlistBuddy -c "Clear dict" "$PLIST_PATH" >/dev/null 2>&1 \
    || rm -f "$PLIST_PATH"
/usr/libexec/PlistBuddy -c "Add :apiKey string $KEY" "$PLIST_PATH" >/dev/null 2>&1 \
    || /usr/libexec/PlistBuddy -c "Set :apiKey $KEY" "$PLIST_PATH" >/dev/null 2>&1

if [ ! -f "$PLIST_PATH" ]; then
    echo "error: failed to write $PLIST_NAME into the app bundle" >&2
    exit 1
fi

# Presence only. Never the value, never a prefix, never a length that would
# narrow it.
if [ -n "$KEY" ]; then
    echo "note: $PLIST_NAME written (key present)"
else
    echo "note: $PLIST_NAME written (key MISSING)"
fi
