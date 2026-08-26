import { useWindowDimensions } from 'react-native'

// Width-based tablet breakpoint, layered alongside `useScreenLayout()` rather than folded into it -
// `useScreenLayout()`'s compact/normal split is height-based (landscape-phone detection) and has
// ~20 unrelated consumers app-wide that only ever check `=== 'compact'`; a width concern doesn't
// belong in that hook's own meaning (same reasoning `useRideOverlayLayout` documents for its own
// width-driven logic).
//
// 768dp sits comfortably above every phone width used in this codebase's own Storybook viewports
// (largest registered phone, Google Pixel 8 Pro landscape, is 915 - but that resolves to
// `useScreenLayout()`'s compact bucket via its height, not this check) and below every registered
// tablet viewport (iPad Air 1180, iPad Pro 12.9" 1366, Galaxy Tab S9 1600). It matches the common
// 600-768dp "tablet" convention used elsewhere (Material Design, Bootstrap).
export const TABLET_MIN_WIDTH = 768

export const useIsTablet = (): boolean => {
    const { width } = useWindowDimensions()
    return width >= TABLET_MIN_WIDTH
}
