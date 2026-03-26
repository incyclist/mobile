declare module 'react-native-system-navigation-bar' {
    const SystemNavigationBar: {
        stickyImmersive: (enable?: boolean) => Promise<void>;
        immersive: (enable?: boolean) => Promise<void>;
        leanBack: (enable?: boolean) => Promise<void>;
        navigationHide: (hidden?: boolean) => Promise<void>;
        navigationShow: () => Promise<void>;
        fullScreen: (enable?: boolean) => Promise<void>;
    };
    export default SystemNavigationBar;
}