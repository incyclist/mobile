import { useWindowDimensions } from "react-native"

export type ScreenLayout = 'compact' | 'normal'  // 'tv' could be added later

export const useScreenLayout = (): ScreenLayout => {
    const { height } = useWindowDimensions()
    return height < 420 ? 'compact' : 'normal'
}