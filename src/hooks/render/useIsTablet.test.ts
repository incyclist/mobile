import { renderHook } from '@testing-library/react-native'
import { useIsTablet, TABLET_MIN_WIDTH } from './useIsTablet'

const mockDimensions = { width: 400, height: 800 }
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
    default: jest.fn(() => mockDimensions),
}))

const setWidth = (width: number) => {
    mockDimensions.width = width
}

describe('useIsTablet', () => {
    it('returns false below the tablet width breakpoint', () => {
        setWidth(TABLET_MIN_WIDTH - 1)
        const { result } = renderHook(() => useIsTablet())
        expect(result.current).toBe(false)
    })

    it('returns true exactly at the tablet width breakpoint', () => {
        setWidth(TABLET_MIN_WIDTH)
        const { result } = renderHook(() => useIsTablet())
        expect(result.current).toBe(true)
    })

    it('returns true above the tablet width breakpoint', () => {
        setWidth(1180) // iPad Air landscape width
        const { result } = renderHook(() => useIsTablet())
        expect(result.current).toBe(true)
    })

    it('returns true for a wide phone-landscape width - this hook is width-only; callers combine it with useScreenLayout()\'s height-based compact check to exclude landscape phones', () => {
        setWidth(915) // Google Pixel 8 Pro landscape width
        const { result } = renderHook(() => useIsTablet())
        expect(result.current).toBe(true)
    })

    it('returns false for a typical phone portrait width', () => {
        setWidth(393) // iPhone 15 Pro portrait width
        const { result } = renderHook(() => useIsTablet())
        expect(result.current).toBe(false)
    })
})
