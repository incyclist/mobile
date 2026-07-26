import React, { FC } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { DeviceSelectionItemProps } from 'incyclist-services';

import WifiIcon from '../../assets/icons/wifi.svg';
import BleIcon from '../../assets/icons/ble.svg';
import { colors,textSizes } from '../../theme'

// Conditional import to prevent Storybook Vite from crashing - same pattern as
// RouteItemView/WorkoutItemView. The revealed delete action uses RNGH's own
// TouchableOpacity (not React Native's) since it lives inside Swipeable's
// gesture tree, where a plain RN TouchableOpacity's tap can be swallowed by the
// native pan/tap recognizers right after the swipe-open gesture.
let Swipeable: any = View;
let ActionTouchableOpacity: any = TouchableOpacity;
try {
    if (Platform.OS !== 'web') {
        const gestureHandler = require('react-native-gesture-handler');
        Swipeable = gestureHandler.Swipeable;
        ActionTouchableOpacity = gestureHandler.TouchableOpacity;
    }
} catch {
    // Storybook (Vite) / any environment without the native gesture-handler module:
    // still render the revealed actions (just inline, unanimated) instead of silently
    // dropping renderRightActions - otherwise the delete action never appears at all in
    // Storybook or in Jest/RTL tests, and its wiring can never be exercised.
    Swipeable = ({ children, renderRightActions }: any) => (
        <View>
            {children}
            {renderRightActions?.()}
        </View>
    );
}

type ComponentProps = DeviceSelectionItemProps &  {
    disabled?: boolean
}

const DeviceEntry: FC<ComponentProps> = ({
    connectState,
    deviceName,
    value,
    disabled,
    interface: deviceInterface,
    isSelected,
    onClick,
    onDelete,
}) => {

    const renderConnectState = () => {
    switch (connectState) {
        case 'connecting':
            return <ActivityIndicator size={textSizes.listEntry-4} color="#fff" />; // Visual scanning impression
        case 'connected':
            return <Text style={[styles.statusIcon,disabled && styles.disabled]}>✔</Text>; // Green checkmark
        case 'failed':
            return <Text style={[styles.statusIcon, disabled  ? styles.disabled : styles.failed]}>✕</Text>; // Red X
        default:
            return <Text style={[styles.statusIcon, disabled && styles.disabled]}> </Text>;
    }
    };

  const InterfaceIcon = deviceInterface === 'wifi' ? WifiIcon : BleIcon;

    const renderRightActions = () => (
        <ActionTouchableOpacity style={styles.deleteAction} onPress={onDelete}>
            <Text style={styles.deleteText}>Delete</Text>
        </ActionTouchableOpacity>
    );

    const content = (
        <TouchableOpacity disabled={disabled} onPress={disabled ? null: onClick} style={[styles.container, (isSelected&&!disabled) && styles.selected]}>

            <View style={styles.colState}>
                {renderConnectState()}
            </View>

            <View style={styles.colDeviceName}>
                <Text style={[styles.deviceName,disabled && styles.disabled]} >{deviceName}</Text>
            </View>

            <View style={styles.value}>
                <Text style={[styles.deviceName,disabled && styles.disabled]}>{value??' '}</Text>
            </View>

            <View style={styles.colInterface}>
                <InterfaceIcon width={20} height={20} fill="#fff" style={styles.interfaceIcon} />
            </View>
        </TouchableOpacity>
    );

    // No delete gesture when the row is disabled ("Disable All" checked) or when
    // the page service hasn't wired an onDelete handler for this entry.
    if (!onDelete || disabled) return content;

    return <Swipeable renderRightActions={renderRightActions}>{content}</Swipeable>;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 8,
    // borderBottomWidth: 1,
    // borderBottomColor: colors.listSeparator
  },
  colState: {
    width: textSizes.listEntry,
    height: textSizes.listEntry,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colDeviceName: {
    flex:1,
  },
  disabled: {
    color: colors.disabled
  },
  colInterface: {
    width: textSizes.listEntry,
    height: textSizes.listEntry,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selected: {
    backgroundColor: colors.selected
  },
  deviceName: {
    color: '#fff',
    fontSize: textSizes.listEntry,
  },
  value: {
    color: '#fff',
    fontSize: textSizes.listEntry,
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: textSizes.listEntry,
    justifyContent: 'center',
    alignItems: 'center',    
    color: 'green', // Green checkmark
  },
  failed: {
    color: 'red', // Red X
  },
  interfaceIcon: {
    marginLeft: 5,
  },
  deleteAction: {
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    paddingVertical: 8,
  },
  deleteText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default DeviceEntry;
