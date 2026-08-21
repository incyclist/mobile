import { useCallback, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import {
    getRideDashboardWidth,
    fitsSideBySide,
    buildSideRects,
    RIDE_DASHBOARD_ICON_TOP_TILE_THRESHOLD,
    DEFAULT_ROUTE_RIDE_TILE_COUNT,
} from '../../../hooks/render/useRideOverlayLayout';

interface UseRouteOnlyRideGeometryParams {
    /** Both callers already compute this themselves (`useScreenLayout()`) for other, page-specific
     *  purposes, so it stays a plain input rather than a second internal call. */
    isCompact: boolean;
    /** Whether the corner map widget would be visible - differs slightly between GPX (also gates
     *  on the main view already being a map) and Video, so it stays a caller input. */
    mapVisible: boolean;
}

/**
 * Route-only (no workout attached) corner-widget placement math, extracted verbatim from
 * `GPX/View.tsx` and `Video/View.tsx`, which had a near-identical copy (FIXES_BACKLOG.md item #63
 * - SonarCloud duplication). Ports the combo overlay's analytic fit-check/sizing
 * (`getRideDashboardWidth`/`fitsSideBySide`/`buildSideRects`) instead of the old measured-width
 * heuristic - both call sites already carried a comment pointing at "the other file" for the full
 * rationale, which now lives here instead.
 */
export function useRouteOnlyRideGeometry({ isCompact, mapVisible }: UseRouteOnlyRideGeometryParams) {
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();

    const ELEVATION_FULL_HEIGHT = screenHeight * 0.12;
    const ELEVATION_PREVIEW_HEIGHT = screenHeight * 0.20;
    const DASHBOARD_HEIGHT = screenHeight * 0.10;

    // Width is no longer measured (post-Wave-6 fix): the corner-widget placement below uses
    // RideDashboard's analytic width, same as the combo overlay. Height still is; nothing analytic
    // replaces it and the stacked-below fallback still needs it.
    const [dashboardHeight, setDashboardHeight] = useState(DASHBOARD_HEIGHT);
    const updateDashboardDimensions = useCallback((e: any) => {
        setDashboardHeight(e.nativeEvent.layout.height);
    }, []);

    // RideDashboard's own reported tile count, tracked unconditionally so the route-only
    // corner-widget placement gets RideDashboard's real analytic width rather than guessing at the
    // default 7-tile one.
    const [dashboardItemCount, setDashboardItemCount] = useState<number | undefined>(undefined);
    const onDashboardMetrics = useCallback((m: { itemCount: number }) => setDashboardItemCount(m.itemCount), []);

    const dashboardLayoutMode = (dashboardItemCount ?? DEFAULT_ROUTE_RIDE_TILE_COUNT) > RIDE_DASHBOARD_ICON_TOP_TILE_THRESHOLD
        ? 'icon-top' : 'icon-left';
    const rideDashboardWidthEffective = Math.min(
        getRideDashboardWidth({
            itemCount: dashboardItemCount ?? DEFAULT_ROUTE_RIDE_TILE_COUNT,
            layout: dashboardLayoutMode,
            compact: isCompact,
            screenWidth,
        }),
        screenWidth,
    );
    const sideBySideFits = !isCompact && fitsSideBySide(screenWidth, screenHeight, rideDashboardWidthEffective);
    const sideRects = sideBySideFits
        ? buildSideRects(screenWidth, screenHeight, rideDashboardWidthEffective, 0, mapVisible)
        : null;

    // Stacked-below fallback - compact, or the side widgets don't fit beside the dashboard.
    const reservedRight = screenWidth * (isCompact ? 0.20 : 0.15);
    const cornerTopOffset = dashboardHeight + 2;
    const elevationPreviewDynamicStyle = sideRects
        ? { top: sideRects.elevation.top, right: sideRects.elevation.right, width: sideRects.elevation.width, height: sideRects.elevation.height }
        : {
            height: isCompact ? ELEVATION_FULL_HEIGHT : ELEVATION_PREVIEW_HEIGHT,
            top: isCompact ? dashboardHeight : cornerTopOffset,
            width: reservedRight,
        };
    const dashboardDynamicStyle = { height: DASHBOARD_HEIGHT };

    const mapOverlayDynamicStyle = sideRects?.map
        ? { top: sideRects.map.top, left: sideRects.map.left, width: sideRects.map.width, height: sideRects.map.height }
        : {
            width: screenWidth * 0.15,
            height: ELEVATION_PREVIEW_HEIGHT,
            top: cornerTopOffset,
        };

    const bottomBarStyle = {
        position: 'absolute' as const,
        bottom: 0,
        left: 0,
        right: 0,
        height: ELEVATION_FULL_HEIGHT,
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
    };

    return {
        screenWidth,
        screenHeight,
        dashboardHeight,
        dashboardItemCount,
        updateDashboardDimensions,
        onDashboardMetrics,
        dashboardDynamicStyle,
        elevationPreviewDynamicStyle,
        mapOverlayDynamicStyle,
        bottomBarStyle,
    };
}
