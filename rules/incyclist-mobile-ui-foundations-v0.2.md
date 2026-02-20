# Incyclist Mobile — UI Foundations
**Version:** 0.2 (updated after repo audit)
**Status:** Active Reference
**Scope:** React Native UI layer only. Business logic in `incyclist-services` is never modified unless explicitly flagged as a stopper.

---

## 1. Stack — What's Already Here (Do Not Add Without Good Reason)

| Concern | Decision | Status |
|---|---|---|
| Framework | React Native 0.83.1 + TypeScript | ✅ Established |
| Navigation | `@react-navigation/native` + `native-stack` | ✅ Established |
| Styling | `StyleSheet.create()` + `src/theme/` tokens | ✅ Established — see §4 |
| State management | `useState` / `useRef` + direct service observer pattern | ✅ Established — see §3 |
| Component dev / visual testing | Storybook (`@storybook/react-native-web-vite`) | ✅ Established |
| BLE | `react-native-ble-manager` | ✅ Installed |
| Maps | `@maplibre/maplibre-react-native` | ✅ Installed |
| Logging | `gd-eventlog` via `useLogging` hook | ✅ Established |
| SVG icons | `react-native-svg` + `react-native-svg-transformer` | ✅ Established |

**No Zustand. No NativeWind. No additional state library.**
The existing pattern works well and adding a second state layer would compete with `incyclist-services`. See §3 for the correct approach.

---

## 2. Project Structure

```
src/
  pages/              # Full screens — one folder per page
    [PageName]/
      index.ts(x)           # Re-export only
      [PageName].tsx         # Page: subscribes to service observer, owns lifecycle
      View.tsx               # Pure view: renders props only — used for Storybook
      [PageName].stories.tsx
  components/         # Shared UI building blocks
    [ComponentName]/
      index.ts
      types.ts
      [ComponentName].tsx     # Smart (if needs service) or pure
      [ComponentName]View.tsx # Pure view variant (if smart component needed)
      [ComponentName].stories.tsx
      utils.ts                # (optional) component-local helpers
  bindings/           # Platform adapters — do not modify internals
  hooks/              # Shared hooks (useLogging, useUnmountEffect)
  services/           # Navigation, permissions, API, update manager
  theme/              # colors.ts, textSizes.ts — all tokens live here
  assets/             # SVG icons, images
```

**Rules (from existing `rules/react-native.md`):**
- 4-space indentation. Single quotes. TypeScript everywhere.
- `const ComponentName = () => {}` — no class components, no default exports.
- `StyleSheet.create()` at the bottom of every file — no inline style objects.
- All colors → `src/theme/colors.ts`. All text sizes → `src/theme/textSizes.ts`.
- New reusable styles → `src/theme/styles.ts` (create if not present).
- Every component exported from `src/components/index.tsx`.

---

## 3. State Management — The Established Pattern

**There is no separate state management library.** This is correct for this codebase.

`incyclist-services` owns all application state. The UI layer subscribes to it via an **observer pattern**. React's own `useState` / `useRef` hold only the UI-visible snapshot of that state.

### Pattern A — Page with service observer (most pages)

```tsx
// pages/SomePage/SomePage.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { getSomePageService, SomeDisplayProps, IObserver } from 'incyclist-services'
import { useLogging, useUnmountEffect } from '../../hooks'
import { SomePageView } from './View'
import { MainBackground } from '../../components'

const initialProps: SomeDisplayProps = { /* safe empty state */ }

export const SomePage = () => {
    const [props, setProps] = useState<SomeDisplayProps>(initialProps)
    const refObserver = useRef<IObserver | null>(null)
    const service = getSomePageService()
    const { logError } = useLogging('SomePage')

    const onUpdate = useCallback(() => {
        const updated = service.getPageDisplayProperties()
        if (updated) setProps(updated)
    }, [service])

    useEffect(() => {
        if (!service || refObserver.current) return
        try {
            refObserver.current = service.openPage()
            refObserver.current.on('page-update', onUpdate)
            onUpdate()
        } catch (err: any) {
            logError(err, 'init')
        }
    }, [service, logError, onUpdate])

    useUnmountEffect(() => { service.closePage() })

    if (!refObserver.current) return <MainBackground />
    return <SomePageView {...props} />
}
```

### Pattern B — Component with service observer (smart component)

Same structure as Pattern A but without `openPage/closePage` — use the relevant service method to get an observer for that component's slice of state. See `BleInterfaceSettings.tsx` as the canonical example.

### Pattern C — Pure navigation page (no live data)

```tsx
// pages/SomePage/SomePage.tsx
import React from 'react'
import { useIncyclist } from 'incyclist-services'
import { navigate } from '../../services'
import { SomePageView } from './View'

export const SomePage = () => {
    const incyclist = useIncyclist()
    const onClick = (item: string) => {
        if (item === 'exit') incyclist.onAppExit().then(() => { /* quit */ })
        else navigate(item)
    }
    return <SomePageView onClick={onClick} />
}
```

### Key rules
- **Never** import from `bindings/` directly in a page or component — only via hooks or the service layer.
- `useState` is for the UI snapshot. The source of truth is always in `incyclist-services`.
- Local UI state (modal open/closed, loading spinner, input value) stays in `useState` — do not push this into the service.
- High-frequency updates (telemetry): use `React.memo` on child components and pass only the specific prop they render. See `CapabilityTileView` for the existing pattern.

---

## 4. Styling Conventions

**Use `StyleSheet.create()`. No NativeWind. No styled-components.**
The existing codebase is consistent and this is working well.

### Tokens

All tokens are in `src/theme/`. Import relatively:

```ts
import { colors, textSizes } from '../../theme'
```

**Current color tokens (`src/theme/colors.ts`):**
```ts
background:          '#1E1E1E'
tileIdle:            '#3A9CCF'
tileEmpty:           '#9fa4a8'
tileActive:          '#dd9933'
buttonPrimary:       '#dd9933'
selected:            '#dd9933'
button:              '#EEEEEE'
text / textPrimary:  '#FFFFFF'
icon:                '#FFFFFF'
error:               '#D32F2F'
disabled:            '#9fa4a8'
dialogBackground:    gradient ['rgba(56,1,31,0.975)', 'rgba(26,4,86,0.975)']
```

**Current text size tokens (`src/theme/textSizes.ts`):**
```ts
pageTitle:   28
dialogTitle: 24
listEntry:   20
normalText:  16
```

**When adding new tokens:** add to the relevant file — never hardcode color hex values or font sizes inline.

### StyleSheet placement

```tsx
// ✅ Always at the bottom of the file
const styles = StyleSheet.create({
    container: { flex: 1 },
    title: {
        fontSize: textSizes.pageTitle,
        fontWeight: '700',
        color: colors.textPrimary,
    },
})
```

---

## 5. Navigation

React Navigation native stack is configured in `src/pages/RootNavigator/RootNavigator.tsx`.

**Current registered routes:**
```
main, user, settings, search, routes, workouts, activities, rideDeviceOK, devices
```

**To navigate imperatively** (from service callbacks or event handlers):
```ts
import { navigate } from '../../services'
navigate('routeName')
```

**To navigate from a component:**
```ts
import { useNavigation } from '@react-navigation/native'
const navigation = useNavigation()
navigation.navigate('routeName')
```

**When adding a new screen:** register it in `RootNavigator.tsx` AND add its route name to the relevant `TNavigationItem` type if navigation controls reference it.

---

## 6. Components — Split Rule

Only split a component into `ComponentName.tsx` + `View.tsx` when it needs to subscribe to a service observer. If it's pure props-in / render-out, a single file is fine.

| Has service observer? | Structure |
|---|---|
| Yes | `ComponentName.tsx` (smart) + `View.tsx` (pure) — View used for Storybook |
| No | `ComponentName.tsx` only — used directly in Storybook |

---

## 7. Storybook

Uses `@storybook/react-native-web-vite`. All event handlers use `fn()` from `'storybook/test'`.

```tsx
// components/SomeComponent/SomeComponent.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import { SomeComponentView } from './SomeComponentView'

const meta: Meta<typeof SomeComponentView> = {
    title: 'Components/SomeComponent',
    component: SomeComponentView,
}
export default meta

export const Default: StoryObj<typeof SomeComponentView> = {
    args: {
        title: 'Example',
        onPress: fn(),
    },
}
```

Always write stories against the **View** variant (pure props), not the smart component.

---

## 8. Logging

Use `useLogging` hook for all logging within components and pages.

```tsx
const { logError, logEvent } = useLogging('ComponentName')

logEvent({ message: 'something happened', detail: value })
logError(err, 'functionName')
```

---

## 9. Library Addition Policy

Before adding **any** new library:
1. Confirm the feature cannot be reasonably built with what's already installed.
2. Research options — list popularity, maintenance status, license, RN 0.83 compatibility.
3. **Align before implementing** — document the chosen library and installation steps for Android + iOS.
4. Check if a library is already installed that covers the need (there are ~35 dependencies — check `package.json` first).

**Note on the `uninstall` package:** `"uninstall": "^0.0.0"` in dependencies appears to be an accidental `npm install uninstall` — this is a no-op package and can be removed.

---

## 10. Open Technical Decisions

Tracked here, resolved when a screen makes them a concrete requirement:

| Decision | Status | Trigger |
|---|---|---|
| ANT+ support | ⏳ Pending | First screen that needs ANT+ device |
| Native video player | ⏳ Pending | Any ride / route video screen |
| Video conversion on mobile | ⏳ Pending | Route import or video management screen |
| Offline storage structure / cache limits | ⏳ Pending | Route or ride detail screens |
| Secure token storage | ⏳ Pending | Auth / login screen |
| `react-native-create-thumbnail` usage | ⏳ Clarify | Already installed — confirm it's in use or remove |
| `@react-native/new-app-screen` | ⏳ Remove | Dev scaffold — not needed in production |

---

## 11. How to Use This Document (for Dev Agent)

When implementing any screen or component:

1. Read the **Screen Spec** provided alongside this document.
2. Follow the file structure in §2 exactly.
3. Use the correct pattern from §3 (A, B, or C) based on whether the screen needs a service observer.
4. Style with `StyleSheet.create()` using tokens from §4. Never hardcode colors or font sizes.
5. Register new screens in `RootNavigator.tsx` per §5.
6. Apply the component split rule from §6.
7. Write a Storybook story per §7 for every new component.
8. Use `useLogging` per §8 wherever logging is needed.
9. Do **not** modify anything under `src/bindings/` — only consume the interface described in the Screen Spec.
10. Do **not** add new libraries without alignment per §9.
