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

// No longer used by WorkoutRidePage (FIXES_BACKLOG #24, bug 2/2) - the workout ride-observer's
// 'Finished' path now converges onto menuProps.finished like every other ride type, instead of
// the removed 'navigate-back' page-observer event this was originally added for
// (workout-ride-page-service-design.md §5). Kept as general-purpose navigation infra; the RideMenu
// End-Ride flow still goes through RidePageService.onEndRide() -> moveToPreviousPage (unchanged
// for every ride type), not this helper.
export const goBack = () => {
    if (navigationRef.isReady() && navigationRef.canGoBack()) {
        navigationRef.goBack();
    }
};
