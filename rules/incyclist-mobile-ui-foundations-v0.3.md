# Incyclist Mobile — UI Foundations v0.3

## 1. Stack (do not add without alignment)
- React Native 0.83.1 + TypeScript
- Navigation: `@react-navigation/native` + `native-stack`
- Styling: `StyleSheet.create()` + `src/theme/` tokens. No NativeWind, no styled-components.
- State: `useState` / `useRef` + service observer pattern. No Zustand, no Redux.
- Storybook: `@storybook/react-native-web-vite`
- Logging: `gd-eventlog` via `useLogging` hook
- SVG icons: `react-native-svg` via `src/components/Icon`
- Maps: `@maplibre/maplibre-react-native`
- Storage: `react-native-mmkv` via `src/bindings/db`

## 2. Project Structure
```
src/
  pages/[PageName]/
    index.ts            # re-export only
    [PageName].tsx      # subscribes to service observer, owns lifecycle
    View.tsx            # pure view, used for Storybook
    [PageName].stories.tsx
  components/[ComponentName]/
    index.ts, types.ts
    [ComponentName].tsx       # smart (if needs service) or pure
    [ComponentName]View.tsx   # pure view variant if smart
    [ComponentName].stories.tsx
  bindings/   # platform adapters — consume only, never modify internals
  hooks/      # useLogging, useUnmountEffect
  theme/      # colors.ts, textSizes.ts
  assets/icons/ # raw SVG source files
```

## 3. State Pattern
`incyclist-services` owns all app state. UI subscribes via observer.

**Page with observer:**
```tsx
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
        refObserver.current = service.openPage()
        refObserver.current.on('page-update', onUpdate)
        onUpdate()
    }, [service, logError, onUpdate])
    useUnmountEffect(() => { service.closePage() })
    if (!refObserver.current) return <MainBackground />
    return <SomePageView {...props} />
}
```

**Rules:**
- Never import from `bindings/` in pages/components — only via service layer
- `useState` = UI snapshot only. Source of truth = `incyclist-services`
- Local UI state (modals, inputs) stays in `useState`
- All refs named `ref<CamelCase>` (e.g. `refObserver`, `refInitialized`)

## 4. Styling
- `StyleSheet.create()` at bottom of every file
- All colors → `src/theme/colors.ts`. All text sizes → `src/theme/textSizes.ts`
- Never hardcode hex values or font sizes inline

**Color tokens:**
```
background: '#1E1E1E' | buttonPrimary/selected/tileActive: '#dd9933'
text/icon: '#FFFFFF' | disabled: '#9fa4a8' | error: '#D32F2F'
dialogBackground: gradient ['rgba(56,1,31,0.975)', 'rgba(26,4,86,0.975)']
```

**Text size tokens:** `pageTitle:28, dialogTitle:24, listEntry:20, normalText:16`

## 5. Navigation
Routes: `main, user, settings, search, routes, workouts, activities, rideDeviceOK, devices`
```ts
import { navigate } from '../../services'
navigate('routeName')
```
New screens must be registered in `RootNavigator.tsx`.

## 6. Component Split Rule
- Has service observer → `ComponentName.tsx` (smart) + `View.tsx` (pure)
- Pure props-in/render-out → single file

## 7. Storybook
- Every component needs to have a storybook demonstrating the use of its properties
- Stories always against the **View** variant
- Event handlers use `fn()` from `'storybook/test'`
- Import: `import type { Meta, StoryObj } from '@storybook/react'`

## 8. Logging
```tsx
const { logError, logEvent } = useLogging('ComponentName')
logEvent({ message: 'page shown', page: 'ComponentName' })  // pages
logEvent({ message: 'dialog shown', dialog: 'Name' })        // dialogs
logError(err, 'functionName')
```

## 9. Library Policy
Check `package.json` first (~35 deps). Do not add without alignment.

## 10. Icons
Use `src/components/Icon`: `<Icon name="funnel" size={20} color={colors.text} />`
Available: `funnel, chevron-up, chevron-down, plus, import-route`


## 11. Agent rules
Output complete files only — no diffs, full content in backtick blocks.
Output only files that were changed

