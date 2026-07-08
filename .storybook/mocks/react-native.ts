/**
 * Storybook mock for react-native.
 * Extends react-native-web with specific stubs needed for the app.
 *
 * NOTE: this file is only effective because of the
 * 'force-react-native-mock-alias' plugin in .storybook/main.ts.
 * Without it, vite-plugin-rnw (injected by @storybook/react-native-web-vite)
 * overrides the 'react-native' alias with 'react-native-web' and this file
 * is never loaded. See the comment on that plugin for details.
 */

export const Linking = {
    openURL: () => Promise.resolve(),
    canOpenURL: () => Promise.resolve(true),
    addEventListener: () => ({ remove: () => {} }),
    removeEventListener: () => {},
    getInitialURL: () => Promise.resolve(null),
};

// Many React Native packages (react-native-gesture-handler, react-native-svg,
// react-native-localize, react-native-screens, etc.) call
// TurboModuleRegistry.getEnforcing() at module init time inside their
// specs/fabric files (top-level ESM side-effect). react-native-web does not
// export TurboModuleRegistry at all, so without this stub the import crashes
// at ESM link time.
//
// getEnforcing() returns a Proxy where every property is a callable no-op
// (getConstants returns {}), so packages that immediately call methods on the
// module at import time (e.g. NativeModule.getConstants()) don't crash either.
const nativeModuleStub: any = new Proxy({}, {
    get(_target, prop) {
        // don't make the stub thenable / don't break String(stub)
        if (typeof prop === 'symbol' || prop === 'then') return undefined;
        if (prop === 'getConstants') return () => ({});
        return () => undefined;
    },
});

export const TurboModuleRegistry = {
    get: (_name: string) => null,
    getEnforcing: (_name: string): any => nativeModuleStub,
};

// Also not provided by react-native-web; imported by codegen'd native
// component specs (e.g. src/specs/*). Importing a missing named export from
// a pre-bundled ESM chunk is a link-time crash, so stub them here.
export const codegenNativeComponent = (_name: string, _options?: any): any => () => null;
export const requireNativeComponent = (_name: string): any => () => null;

// Re-export all standard components and APIs from react-native-web.
// In ESM, the local exports above take precedence over those in RNW.
export * from 'react-native-web';