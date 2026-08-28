import React, { useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    TouchableOpacity,
    TouchableWithoutFeedback,
    useWindowDimensions,
    Pressable,
    ScrollView,
    LayoutChangeEvent
} from 'react-native';
import { RideMenuViewProps } from './types';
import { colors, textSizes } from '../../theme';
import { useScreenLayout, useIsTablet, useLogging } from '../../hooks';
import { Icon } from '../Icon';
import { Button } from '../ButtonBar';
import { GearSettings } from '../GearSettings';
import { RideSettings } from '../RideSettings';
import { ActivitySummaryDialog } from '../ActivitySummaryDialog';
import { WorkoutSettingsDialog } from '../WorkoutSettingsDialog';

interface RowButtonSpec {
    icon: any;
    label: string;
    onPress: () => void;
    disabled?: boolean;
}

interface TileSpec {
    icon?: any;
    label: string;
    onPress: () => void;
    disabled?: boolean;
    // Fuller wording for screen readers when the visible label is a short numeric abbreviation
    // (e.g. "+5W") that reads unclearly on its own - defaults to `label` otherwise.
    accessibilityLabel?: string;
}

interface MagnitudeRowSpec {
    label: string;
    small: { text: string; onPress: () => void };
    big: { text: string; onPress: () => void };
}

// Panel width caps, named rather than inlined. PHONE_MAX_PANEL_WIDTH is the pre-existing 300px
// cap, kept unchanged for phone-width screens. TABLET_MAX_PANEL_WIDTH is a new, larger ceiling so
// the panel scales with screenWidth on tablets instead of being clamped to the phone value -
// still capped so it doesn't stretch absurdly wide on very large tablets.
const PHONE_MAX_PANEL_WIDTH = 300;
const TABLET_MAX_PANEL_WIDTH = 420;

export const RideMenuView = ({
    visible,
    showResume,
    activeDialog,
    onClose,
    onPause,
    onResume,
    onEndRide,
    onGearSettings,
    onRideSettings,
    onDialogClose,
    onExitFromSummary,

    workout = false,
    canStepBack = false,
    canStepForward = false,
    onStepBack = () => {},
    onStepForward = () => {},
    loadControl,
    onIncreaseLoad = () => {},
    onDecreaseLoad = () => {},
    onIncreaseLoadBig = () => {},
    onDecreaseLoadBig = () => {},
    onWorkoutSettings = () => {},
    showRideSettings = true,

    renderGearSettings = () => <GearSettings onClose={onDialogClose} />,
    renderRideSettings = () => <RideSettings onClose={onDialogClose} />,
    renderActivitySummary = () => <ActivitySummaryDialog onClose={onDialogClose} onExit={onExitFromSummary} />,
    renderWorkoutSettings = () => <WorkoutSettingsDialog onClose={onDialogClose} />,

}: RideMenuViewProps) => {
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const layout = useScreenLayout();
    const isCompact = layout === 'compact';
    const isTablet = useIsTablet();
    // The pairing rationale below (renderMenuRow/renderTileRow) is about clawing back vertical
    // space on a height-constrained screen, not about width - so it stays keyed off `isCompact`
    // even on a tablet-width screen that happens to also be short. On every real device, a
    // tablet-width screen is not compact, so this only changes anything for typical tablets.
    const useSingleColumnRows = isTablet && !isCompact;
    const { logEvent } = useLogging('RideMenu');

    const maxPanelWidth = isTablet ? TABLET_MAX_PANEL_WIDTH : PHONE_MAX_PANEL_WIDTH;
    const panelWidth = isCompact
        ? screenWidth * 0.35
        : Math.min(maxPanelWidth, screenWidth * 0.35);

    const refPanelHeight = useRef<number>(screenHeight);
    const animTranslateY = useRef(new Animated.Value(screenHeight)).current;

    const onLayout = useCallback((event: LayoutChangeEvent) => {
        refPanelHeight.current = event.nativeEvent.layout.height;
    }, []);

    const panelHiddenByDialog = activeDialog !== null;

    useEffect(() => {
        if (panelHiddenByDialog) {
            animTranslateY.setValue(refPanelHeight.current);
            return;
        }

        const targetValue = visible ? 0 : refPanelHeight.current;

        Animated.timing(animTranslateY, {
            toValue: targetValue,
            duration: 220,
            useNativeDriver: true,
        }).start();
    }, [visible, animTranslateY, panelHiddenByDialog, refPanelHeight]);

    // Icon-only half-width button used to pack two related actions (e.g. Step Back/Forward,
    // Decrease/Increase Load) onto a single row - keeps the compact panel short on phones.
    const renderRowButton = ({ icon, label, onPress, disabled = false }: RowButtonSpec) => {
        const handlePress = () => {
            logEvent({ message: 'button clicked', button: label });
            onPress();
        };

        return (
            <Pressable
                key={label}
                onPress={handlePress}
                disabled={disabled}
                accessibilityLabel={label}
                style={({ pressed }) => [
                    styles.rowButton,
                    pressed && !disabled && styles.menuItemPressed,
                ]}
            >
                <Icon
                    name={icon}
                    size={24}
                    color={disabled ? colors.disabled : colors.text}
                />
            </Pressable>
        );
    };

    const renderMenuRow = (rowLabel: string, left: RowButtonSpec, right: RowButtonSpec) => {
        // On tablet-width screens there is no vertical pressure to pack two buttons onto a shared
        // row, so each button gets its own full-width row with its own label instead.
        if (useSingleColumnRows) {
            return (
                <React.Fragment key={rowLabel}>
                    <View style={styles.menuRow}>
                        <Text style={styles.menuItemLabel}>{left.label}</Text>
                        <View style={styles.menuRowButtons}>{renderRowButton(left)}</View>
                    </View>
                    <View style={styles.menuRow}>
                        <Text style={styles.menuItemLabel}>{right.label}</Text>
                        <View style={styles.menuRowButtons}>{renderRowButton(right)}</View>
                    </View>
                </React.Fragment>
            );
        }

        return (
            <View style={styles.menuRow} key={rowLabel}>
                <Text style={styles.menuItemLabel}>{rowLabel}</Text>
                <View style={styles.menuRowButtons}>
                    {renderRowButton(left)}
                    {renderRowButton(right)}
                </View>
            </View>
        );
    };

    // Small/big magnitude value, its own tappable chip with its own visible text (e.g. "+5W") -
    // there is no separate static caption next to it, so there is nothing inert nearby to
    // mistakenly tap instead of the value itself.
    const renderValueButton = (text: string, onPress: () => void) => {
        const handlePress = () => {
            logEvent({ message: 'button clicked', button: text });
            onPress();
        };

        return (
            <Pressable
                key={text}
                onPress={handlePress}
                accessibilityLabel={text}
                style={({ pressed }) => [
                    styles.valueButton,
                    pressed && styles.menuItemPressed,
                ]}
            >
                <Text style={styles.valueButtonText}>{text}</Text>
            </Pressable>
        );
    };

    // Three-column row (label, small step, big step) for the Load/Gear row - e.g.
    // "Increase Load   +5W   +50W" / "Decrease Load   -5W   -50W". Small = loadIncrement (via
    // onIncreaseLoad/onDecreaseLoad), big = the swipe gesture's own "big" step (via
    // onIncreaseLoadBig/onDecreaseLoadBig).
    const renderMagnitudeRow = ({ label, small, big }: MagnitudeRowSpec) => (
        <View style={styles.menuRow} key={label}>
            <Text style={styles.menuItemLabel}>{label}</Text>
            <View style={styles.menuRowButtons}>
                {renderValueButton(small.text, small.onPress)}
                {renderValueButton(big.text, big.onPress)}
            </View>
        </View>
    );

    // Half-width icon+label tile, used to pack two unrelated settings entries (Gear Settings,
    // Ride Settings, Workout Settings) onto shared rows the same way Step/Load already share
    // rows. Unlike renderRowButton (icon-only, one shared row caption), each of these actions
    // needs its own visible label, so this uses the same icon+label content as a full-width
    // menu item, just at roughly half width.
    const renderMenuTile = ({ icon, label, onPress, disabled = false, accessibilityLabel }: TileSpec) => {
        const handlePress = () => {
            logEvent({ message: 'button clicked', button: label });
            onPress();
        };

        return (
            <Pressable
                key={label}
                onPress={handlePress}
                disabled={disabled}
                accessibilityLabel={accessibilityLabel ?? label}
                style={({ pressed }) => [
                    styles.menuTile,
                    pressed && !disabled && styles.menuItemPressed,
                ]}
            >
                {icon && (
                    <View style={styles.menuItemIcon}>
                        <Icon
                            name={icon}
                            size={24}
                            color={disabled ? colors.disabled : colors.text}
                        />
                    </View>
                )}
                <Text style={[styles.menuItemLabel, disabled && styles.menuItemLabelDisabled]}>
                    {label}
                </Text>
            </Pressable>
        );
    };

    const renderTileRow = (rowKey: string, left: TileSpec, right?: TileSpec) => {
        // Same reasoning as renderMenuRow: the 2-column packing exists to save vertical space on a
        // height-constrained screen, which a tablet-width screen isn't - so each tile gets its own
        // full-width row there instead.
        if (useSingleColumnRows) {
            return (
                <React.Fragment key={rowKey}>
                    <View style={styles.menuTileRow}>{renderMenuTile(left)}</View>
                    {right && <View style={styles.menuTileRow}>{renderMenuTile(right)}</View>}
                </React.Fragment>
            );
        }

        return (
            <View style={styles.menuTileRow} key={rowKey}>
                {renderMenuTile(left)}
                {right ? renderMenuTile(right) : <View style={styles.menuTileSpacer} />}
            </View>
        );
    };

    const panelIsVisuallyActive = visible && !panelHiddenByDialog;

    const rootContainerPointerEvents = (visible || activeDialog !== null) ? 'box-none' : 'none';
    const backdropOpacity = panelIsVisuallyActive ? 1 : 0;
    const backdropPointerEvents = panelIsVisuallyActive ? 'auto' : 'none';
    const panelOpacity = panelIsVisuallyActive ? 1 : 0;
    const panelPointerEvents = panelIsVisuallyActive ? 'box-none' : 'none';

    const panelAnimatedOpacityAndPointerEvents = {
        opacity: panelOpacity,
        pointerEvents: panelPointerEvents as 'box-none' | 'none',
    };

    const panelDynamicLayout = {
        width: panelWidth,
        transform: [{ translateY: animTranslateY }],
    };

    return (
        <View
            style={StyleSheet.absoluteFill}
            pointerEvents={rootContainerPointerEvents}
        >
            <TouchableWithoutFeedback
                onPress={onClose}
                disabled={!backdropPointerEvents}
            >
                <View
                    style={[styles.backdrop, { opacity: backdropOpacity }]}
                    pointerEvents={backdropPointerEvents}
                />
            </TouchableWithoutFeedback>

            <Animated.View
                onLayout={onLayout}
                style={[
                    styles.panel,
                    panelDynamicLayout,
                    isCompact ? styles.panelCompact : styles.panelTablet,
                    panelAnimatedOpacityAndPointerEvents
                ]}
            >
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>MENU</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Text style={styles.closeButtonText}>✕</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    <ScrollView contentContainerStyle={styles.contentScroll}>
                        {workout && renderMenuRow('Step',
                            { icon: 'chevron-left', label: 'Step Back', onPress: onStepBack, disabled: !canStepBack },
                            { icon: 'chevron-right', label: 'Step Forward', onPress: onStepForward, disabled: !canStepForward }
                        )}
                        {/* Label/icon/visibility come from RidePageService.menuProps.loadControl -
                            this view renders it as-is rather than deciding "Load" vs "Gear" (or
                            whether to show the row at all) from cycling mode itself, per the
                            workspace's services=what/mobile=how split. Independent of `workout` -
                            a plain route ride still needs Load/Gear buttons whenever cycling mode
                            calls for them.

                            Tablet width only: three-column rows (label, small step, big step) -
                            e.g. "Increase Load   +5W   +50W" / "Decrease Load   -5W   -50W" - each
                            value is its own tappable chip with its own visible text, so there is
                            no separate static caption sitting next to a small icon-only button a
                            rider could mistakenly tap instead. Phones have no vertical room for a
                            second row here, so they keep the original single "Load  <  >" /
                            "Gear  <  >" row (small step only - big step is tablet-only, gated the
                            same way as the Step/Settings rows above). */}
                        {useSingleColumnRows
                            ? <>
                                {loadControl?.visible && loadControl.buttons && renderMagnitudeRow({
                                    label: `Increase ${loadControl.label ?? 'Load'}`,
                                    small: { text: loadControl.buttons.inc1, onPress: onIncreaseLoad },
                                    big: { text: loadControl.buttons.inc5, onPress: onIncreaseLoadBig },
                                })}
                                {loadControl?.visible && loadControl.buttons && renderMagnitudeRow({
                                    label: `Decrease ${loadControl.label ?? 'Load'}`,
                                    small: { text: loadControl.buttons.dec1, onPress: onDecreaseLoad },
                                    big: { text: loadControl.buttons.dec5, onPress: onDecreaseLoadBig },
                                })}
                              </>
                            : loadControl?.visible && renderMenuRow(loadControl.label ?? 'Load',
                                { icon: 'minus', label: `Decrease ${loadControl.label ?? 'Load'}`, onPress: onDecreaseLoad },
                                { icon: 'plus', label: `Increase ${loadControl.label ?? 'Load'}`, onPress: onIncreaseLoad }
                              )
                        }
                        {/* Settings tiles have no icon - all three line up flush-left with each
                            other regardless of which row/column they land in. Gear/Ride Settings
                            pair onto one row and Workout Settings gets its own row - a 2-column
                            layout, same reasoning as the Step/Load rows above, to remove one 52px
                            row on the height-constrained landscape phone layout. Ride Settings
                            (Ride View selector) is route-specific - omitted (via renderTileRow's
                            optional `right`) on a route-less Workout-only ride, per
                            menuProps.showRideSettings. */}
                        {renderTileRow('SettingsRow1',
                            { label: 'Gear Settings', onPress: onGearSettings },
                            showRideSettings ? { label: 'Ride Settings', onPress: onRideSettings } : undefined
                        )}
                        {workout && renderTileRow('SettingsRow2',
                            { label: 'Workout Settings', onPress: onWorkoutSettings }
                        )}
                    </ScrollView>
                </View>

                <View style={styles.footer}>
                    <Button label={showResume ? 'Resume' : 'Pause'} primary onClick={showResume ? onResume : onPause} />
                    <View style={styles.buttonGap} />
                    <Button label='End Ride' attention onClick={onEndRide} />
                </View>
            </Animated.View>

            {activeDialog === 'gearSettings' && renderGearSettings()}
            {activeDialog === 'rideSettings' && renderRideSettings()}
            {activeDialog === 'activitySummary' && renderActivitySummary()}
            {activeDialog === 'workoutSettings' && renderWorkoutSettings()}
        </View>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFill,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    panel: {
        position: 'absolute',
        left: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.88)',
        zIndex: 1000,
        paddingBottom: 20,
    },
    panelTablet: {
        bottom: 0,
    },
    panelCompact: {
        top: 0,
        bottom: 0,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.15)',
    },
    headerTitle: {
        color: colors.text,
        fontSize: textSizes.normalText,
        fontWeight: 'bold',
        letterSpacing: 1.2,
    },
    closeButton: {
        padding: 4,
    },
    closeButtonText: {
        color: colors.text,
        fontSize: 20,
        lineHeight: 24,
    },
    content: {
        flex: 1,
    },
    contentScroll: {
        paddingVertical: 10,
    },
    menuItemPressed: {
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    menuItemIcon: {
        width: 32,
        alignItems: 'center',
        marginRight: 12,
    },
    menuItemLabel: {
        color: colors.text,
        fontSize: textSizes.normalText,
    },
    menuItemLabelDisabled: {
        color: colors.disabled,
    },
    menuRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        minHeight: 52,
    },
    menuRowButtons: {
        flexDirection: 'row',
    },
    rowButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
        borderRadius: 4,
    },
    // Chip-style value button (e.g. "+5W") - a subtle outline gives it a tappable affordance
    // (unlike rowButton, which relies on its icon for that) since its content is just numeric
    // text sitting inline with the row's own label.
    valueButton: {
        minWidth: 48,
        paddingHorizontal: 10,
        paddingVertical: 6,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
    },
    valueButtonText: {
        color: colors.text,
        fontSize: textSizes.normalText,
    },
    menuTileRow: {
        flexDirection: 'row',
        minHeight: 52,
        paddingHorizontal: 20,
        gap: 12,
    },
    menuTile: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuTileSpacer: {
        flex: 1,
    },
    footer: {
        paddingHorizontal: 12,
        paddingTop: 10,
    },
    buttonGap: {
        height: 8,
    },
});
