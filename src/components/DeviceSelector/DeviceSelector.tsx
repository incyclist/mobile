import React, { FC, useState } from 'react';
import { View, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import DeviceEntry from '../DeviceEntry';
import { DeviceSelectionItemProps, DeviceSelectionProps } from 'incyclist-services';
import { textSizes } from '../../theme';
import { Dialog } from '../Dialog';
import { BinarySelect } from '../BinarySelect';

export const DeviceSelector: FC<DeviceSelectionProps> = ({
  devices,
  isScanning,
  disabled,
  changeForAll,
  canSelectAll,
  onClose,
}) => {
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();

    const targetWidth = textSizes.listEntry * 0.6 * 40; // ~288dp
    const dialogWidth = Math.min(0.9 * screenWidth, targetWidth);
    const minHeightLeft = screenHeight - (textSizes.dialogTitle + 100 + 80 + 8);
    const deviceListMinHeight = Math.min(380, minHeightLeft);

    const [all, setAll] = useState<boolean>(canSelectAll && changeForAll);
    const [none, setNone] = useState<boolean>(disabled);

    const onDeviceClicked = (device: DeviceSelectionItemProps) => {
        if (device.onClick) {
            device.onClick(all);
        }
    };

    const onDialogClosed = () => {
        onClose(none === false);
    };

    const dialogStyle = [styles.dialog, { width: dialogWidth }];
    const deviceListStyle = [styles.deviceList, { minHeight: deviceListMinHeight }];

    return (
        <Dialog 
            style={dialogStyle} 
            title={isScanning ? 'Searching ...' : 'Select Device'} 
            onOutsideClick={onDialogClosed}
        >
            <View style={styles.modalView}>
                <ScrollView style={deviceListStyle}>
                    {devices.map((device) => (
                        <DeviceEntry 
                            key={`${device.deviceName}-${device.interface}`} 
                            {...device} 
                            disabled={none} 
                            onClick={() => onDeviceClicked(device)}
                        />
                    ))}
                </ScrollView>

                <View style={styles.footer}>
                    {canSelectAll && (
                        <View style={styles.checkboxContainer}>
                            <BinarySelect
                                label="For all capabilities"
                                labelPosition="after"
                                value={all}
                                onValueChange={setAll}
                            />
                        </View>
                    )}

                    <View style={styles.checkboxContainer}>
                        <BinarySelect
                            label="None"
                            labelPosition="after"
                            value={none}
                            onValueChange={setNone}
                        />
                    </View>
                </View>
            </View>
        </Dialog>
    );
};

const styles = StyleSheet.create({
    dialog: {
        // Dynamic width applied via inline style
    },
    modalView: {
        width: 'auto',
        flex: 1,
        height: '100%',
    },
    deviceList: {
        flex: 1,
        maxHeight: 380,
        // Dynamic minHeight applied via inline style
    },
    footer: {
        flexDirection: 'row',
        height: 60,
        width: '100%',
        position: 'absolute',
        left: 0,
        bottom: 0,
        paddingHorizontal: 15,
        borderTopWidth: 1,
        borderTopColor: '#553388',
        alignItems: 'center',
    },
    checkboxContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 4,
    },
});