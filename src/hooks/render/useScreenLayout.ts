import { useWindowDimensions } from "react-native"

export type ScreenLayout = 'compact' | 'normal'  // 'tv' could be added later

// Shortest-side breakpoint (Android's own `sw600dp` convention) - the single source of truth for
// phone/tablet classification app-wide, shared by useScreenLayout() and useIsTablet(). A
// height-only check (the previous `height < 420`) or a width-only check (the previous
// TABLET_MIN_WIDTH) each misclassify large, "Pro-Max"-class landscape phones as tablets: the app
// is landscape-locked, so those devices' short axis (~430-440px) clears a height-only threshold,
// and their long axis (900px+) clears a width-only one. Checking the shortest side instead keeps
// every such phone under the breakpoint while every registered tablet viewport still clears it
// comfortably (iPad mini 744, iPad Air 820+).
export const TABLET_MIN_SHORTEST_SIDE = 600

export const useIsTabletSize = (): boolean => {
    const { width, height } = useWindowDimensions()
    return Math.min(width, height) >= TABLET_MIN_SHORTEST_SIDE
}

export const useScreenLayout = (): ScreenLayout => useIsTabletSize() ? 'normal' : 'compact'
