import React from 'react';
import { View, StyleSheet } from 'react-native';
import { InterfaceState } from './InterfaceState';

export default {
  title: 'Components/InterfaceState',
  component: InterfaceState,
  decorators: [
    (Story: any) => (
      <View style={styles.decorator}>
        <Story />
      </View>
    ),
  ],
};

export const BluetoothScanning = () => (
  <InterfaceState name="ble" state="scanning" />
);

export const WifiIdle = () => (
  <InterfaceState name="wifi" state="idle" />
);

export const BluetoothError = () => (
  <InterfaceState name="ble" state="error" error="Connection Failed" />
);

export const WifiDisabled = () => (
  <InterfaceState name="wifi" state="disabled" />
);

const styles = StyleSheet.create({
  decorator: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1C1C1E', // Dark background to see white icons
  },
});
