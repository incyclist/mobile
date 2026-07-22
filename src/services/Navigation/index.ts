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

// Used by WorkoutRidePageService's `navigate-back` page-observer event
// (workout-ride-page-service-design.md §5): "UI calls navigation.goBack()".
// Distinct from the RideMenu End-Ride flow, which still goes through
// RidePageService.onEndRide() -> moveToPreviousPage (unchanged for every ride type).
export const goBack = () => {
    if (navigationRef.isReady() && navigationRef.canGoBack()) {
        navigationRef.goBack();
    }
};
