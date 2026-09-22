import { renderHook } from '@testing-library/react-native'
import { useScreenLayout, TABLET_MIN_SHORTEST_SIDE } from './useScreenLayout'

const mockDimensions = { width: 400, height: 800 }
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
    default: jest.fn(() => mockDimensions),
}))

const setDimensions = (width: number, height: number) => {
    mockDimensions.width = width
    mockDimensions.height = height
}

describe('useScreenLayout', () => {
    it('is compact for a typical phone in landscape', () => {
        setDimensions(852, 393) // iPhone 15 Pro landscape
        const { result } = renderHook(() => useScreenLayout())
        expect(result.current).toBe('compact')
    })

    // Regression for the reported bug (mobile#453): a large "Pro-Max"-class phone's landscape
    // short side (~430) used to clear the old `height < 420` threshold and get misclassified as
    // 'normal' (tablet), rendering a tablet-oriented layout in a phone-sized viewport.
    it('is compact for a "Pro-Max"-class phone in landscape', () => {
        setDimensions(932, 430)
        const { result } = renderHook(() => useScreenLayout())
        expect(result.current).toBe('compact')
    })

    it('is normal for a tablet in landscape', () => {
        setDimensions(1180, 820) // iPad Air
        const { result } = renderHook(() => useScreenLayout())
        expect(result.current).toBe('normal')
    })

    it('is normal for a tablet in portrait', () => {
        setDimensions(820, 1180)
        const { result } = renderHook(() => useScreenLayout())
        expect(result.current).toBe('normal')
    })

    it('switches on the shortest-side breakpoint', () => {
        setDimensions(1200, TABLET_MIN_SHORTEST_SIDE)
        expect(renderHook(() => useScreenLayout()).result.current).toBe('normal')

        setDimensions(1200, TABLET_MIN_SHORTEST_SIDE - 1)
        expect(renderHook(() => useScreenLayout()).result.current).toBe('compact')
    })
})
