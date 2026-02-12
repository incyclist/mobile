import React, { FC } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { DeviceSelectionItemProps } from 'incyclist-services';

import WifiIcon from '../../assets/icons/wifi.svg'; 
import BleIcon from '../../assets/icons/ble.svg';
import { colors,textSizes } from '../../theme'

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

    return (
        <TouchableOpacity disabled={disabled} onPress={disabled ? null: onClick} style={[styles.container, (isSelected&&!disabled) && styles.selected]}>

            <View style={styles.colState}>            
                {/* Placeholder for optional delete button (e.g., hidden until hover in web) */}
                {/* On native, delete might be a swipe gesture or a long press action */}
                {/* <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
                    <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity> */}
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
  }
});

export default DeviceEntry;
