import * as RNW from 'react-native-web';

/**
 * Storybook mock for react-native.
 * Extends react-native-web with specific stubs needed for the app.
 */

export const Linking = {
    openURL: () => Promise.resolve(),
    canOpenURL: () => Promise.resolve(true),
    addEventListener: () => ({ remove: () => {} }),
    removeEventListener: () => {},
    getInitialURL: () => Promise.resolve(null),
};

// Re-export all standard components and APIs from react-native-web.
// In ESM, the local 'Linking' export above takes precedence over the one in RNW.
export * from 'react-native-web';