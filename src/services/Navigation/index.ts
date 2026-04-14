import { createNavigationContainerRef,StackActions } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef<any>();

export const navigate = (name: string, params?: object) => {
    // if (navigationRef.isReady()) {
    //     navigationRef.navigate(name, params);
    // }

    if (navigationRef.isReady()) {
        navigationRef.dispatch(StackActions.replace(name, params));
    }
};
