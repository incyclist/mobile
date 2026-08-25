import React from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';
import { IObserver, RouteApiDetail } from 'incyclist-services';
import { ElevationGraph, RideMenu, Button } from '../../../components';
import type { AvatarConfig } from '../../../components/ElevationGraph/types';

const RideMenuButton = React.memo(({ onPress }: { onPress: () => void }) => (
    <Button id='menu' label='Menu' primary={true} onClick={onPress} />
));

interface RideBottomBarAndMenuProps {
    bottomBarStyle: ViewStyle;
    menuButtonContainerStyle: StyleProp<ViewStyle>;
    elevationFullStyle: StyleProp<ViewStyle>;
    routeData: RouteApiDetail | undefined;
    rideObserver: IObserver | null | undefined;
    lapMode: boolean | undefined;
    onMenuOpen: () => void;
    menuProps: { finished?: boolean } | null | undefined;
    onMenuClose: () => void;
    onCloseRidePage: () => void;
    /** The current rider's own avatar (already color-resolved) — matches the current-position
     *  marker to the "You" row shown elsewhere (e.g. the `prevRides` list) rather than rendering
     *  with default colors. `undefined` renders the existing default (unchanged behavior). */
    currentAvatar?: AvatarConfig;
}

/**
 * The "Menu button + full-route elevation" bottom bar, plus the RideMenu overlay it opens.
 * Extracted from `GPX/View.tsx`/`Video/View.tsx`, which had a byte-identical copy of both
 * (FIXES_BACKLOG.md item #63 - SonarCloud duplication).
 */
export const RideBottomBarAndMenu = ({
    bottomBarStyle,
    menuButtonContainerStyle,
    elevationFullStyle,
    routeData,
    rideObserver,
    lapMode,
    onMenuOpen,
    menuProps,
    onMenuClose,
    onCloseRidePage,
    currentAvatar,
}: RideBottomBarAndMenuProps) => (
    <>
        <View style={bottomBarStyle}>
            <View style={menuButtonContainerStyle}>
                <RideMenuButton onPress={onMenuOpen} />
            </View>
            <ElevationGraph
                routeData={routeData}
                observer={rideObserver ?? undefined}
                lapMode={lapMode}
                showLine={true}
                showColors={true}
                showXAxis={false}
                showYAxis={false}
                style={elevationFullStyle}
                currentAvatar={currentAvatar}
            />
        </View>

        {menuProps && (
            <RideMenu
                visible={true}
                finished={menuProps.finished}
                onClose={onMenuClose}
                onCloseRidePage={onCloseRidePage}
            />
        )}
    </>
);
