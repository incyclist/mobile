import { renderHook } from '@testing-library/react-native'
import { useIsTablet } from './useIsTablet'
import { TABLET_MIN_SHORTEST_SIDE } from './useScreenLayout'

const mockDimensions = { width: 400, height: 800 }
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
    default: jest.fn(() => mockDimensions),
}))

const setDimensions = (width: number, height: number) => {
    mockDimensions.width = width
    mockDimensions.height = height
}

describe('useIsTablet', () => {
    it('returns false below the shortest-side breakpoint', () => {
        setDimensions(TABLET_MIN_SHORTEST_SIDE - 1, 1200)
        const { result } = renderHook(() => useIsTablet())
        expect(result.current).toBe(false)
    })

    it('returns true exactly at the shortest-side breakpoint', () => {
        setDimensions(TABLET_MIN_SHORTEST_SIDE, 1200)
        const { result } = renderHook(() => useIsTablet())
        expect(result.current).toBe(true)
    })

    it('returns true for a real tablet landscape size', () => {
        setDimensions(1180, 820) // iPad Air landscape
        const { result } = renderHook(() => useIsTablet())
        expect(result.current).toBe(true)
    })

    it('returns false for a "Pro-Max"-class phone landscape size - wide, but short axis stays under the breakpoint', () => {
        setDimensions(932, 430)
        const { result } = renderHook(() => useIsTablet())
        expect(result.current).toBe(false)
    })

    it('returns false for a typical phone landscape size (Pixel 8 Pro)', () => {
        setDimensions(915, 412)
        const { result } = renderHook(() => useIsTablet())
        expect(result.current).toBe(false)
    })

    it('returns false for a typical phone portrait size', () => {
        setDimensions(393, 852) // iPhone 15 Pro portrait
        const { result } = renderHook(() => useIsTablet())
        expect(result.current).toBe(false)
    })

    it('uses the shorter of width/height regardless of orientation', () => {
        setDimensions(1200, TABLET_MIN_SHORTEST_SIDE - 1)
        const { result } = renderHook(() => useIsTablet())
        expect(result.current).toBe(false)
    })
})
