import { renderHook, act } from '@testing-library/react-native';
import { useRouteOnlyRideGeometry } from './useRouteOnlyRideGeometry';

const mockDimensions = { width: 1000, height: 800 };
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
    default: jest.fn(() => mockDimensions),
}));

const setDimensions = (width: number, height: number) => {
    mockDimensions.width = width;
    mockDimensions.height = height;
};

describe('useRouteOnlyRideGeometry', () => {
    beforeEach(() => {
        setDimensions(1920, 800);
    });

    it('places the corner widgets side-by-side when there is room beside the dashboard (isCompact=false)', () => {
        const { result } = renderHook(() => useRouteOnlyRideGeometry({ isCompact: false, mapVisible: true, workoutAttached: false }));

        // Very wide screen, default 7-tile dashboard - side-by-side should fit, so the elevation
        // preview style comes from the analytic sideRects rather than the stacked-below fallback.
        expect(result.current.elevationPreviewDynamicStyle).toHaveProperty('right', 0);
        expect(result.current.mapOverlayDynamicStyle).toHaveProperty('left');
        expect(result.current.dashboardDynamicStyle).toEqual({ height: 800 * 0.10 });
        expect(result.current.bottomBarStyle).toMatchObject({
            position: 'absolute',
            height: 800 * 0.12,
        });
    });

    it('falls back to the stacked-below layout in compact mode', () => {
        setDimensions(400, 700);
        const { result } = renderHook(() => useRouteOnlyRideGeometry({ isCompact: true, mapVisible: false, workoutAttached: false }));

        expect(result.current.elevationPreviewDynamicStyle).toMatchObject({
            width: 400 * 0.20,
        });
    });

    it('tracks dashboard height reported via updateDashboardDimensions', () => {
        const { result } = renderHook(() => useRouteOnlyRideGeometry({ isCompact: false, mapVisible: false, workoutAttached: false }));

        act(() => {
            result.current.updateDashboardDimensions({ nativeEvent: { layout: { height: 123 } } });
        });

        expect(result.current.dashboardHeight).toBe(123);
    });

    it('tracks the dashboard item count reported via onDashboardMetrics', () => {
        const { result } = renderHook(() => useRouteOnlyRideGeometry({ isCompact: false, mapVisible: false, workoutAttached: false }));

        expect(result.current.dashboardItemCount).toBeUndefined();

        act(() => {
            result.current.onDashboardMetrics({ itemCount: 8 });
        });

        expect(result.current.dashboardItemCount).toBe(8);
    });
});
