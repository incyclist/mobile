export const useSafeAreaInsets = () => ({ top: 0, bottom: 0, left: 0, right: 0 });
export const SafeAreaProvider = ({ children }: any) => children;
export const SafeAreaConsumer = ({ children }: any) => children({ top: 0, bottom: 0, left: 0, right: 0 });