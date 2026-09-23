import { useIsTabletSize } from './useScreenLayout'

// Kept as its own named hook (rather than folded away entirely) since call sites read better as
// `useIsTablet()` than `useScreenLayout() === 'normal'` - but both now derive from the one shared
// shortest-side predicate in useScreenLayout.ts, so there is a single place to get the
// phone/tablet breakpoint right instead of two independently-maintained checks.
export const useIsTablet = (): boolean => useIsTabletSize()
