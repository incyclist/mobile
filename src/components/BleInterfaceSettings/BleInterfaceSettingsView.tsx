import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { Dialog } from '../Dialog'; // Path to your Dialog component
import { BleInterfaceSettingsViewProps } from './types';
import { colors } from '../../theme/colors';
import { ButtonProps } from '../ButtonBar/types';

export const BleInterfaceSettingsView = ({
    loading,
    onClose,
    state,
    enabled,
    onEnable,
    onDisable,
    onRequestPermissions,
    needsPermissions
}: BleInterfaceSettingsViewProps) => {

    const {width, height} = useWindowDimensions()

    const styles = StyleSheet.create({
        container: {
            padding: 16,
            width: 0.5*width,
            maxWidth: 0.5*width,
            minHeight: Math.max( 50,0.3*height ),
            justifyContent: 'center',
            maxHeight: 0.9*height,
            backgroundColor:'red'
        },
        text: {
            fontSize: 16,
            color: colors.text,
            textAlign: 'left',
        },
        errorText: {
            color: colors.error,
        }
    });


    const getButtons = () => {


        const closeButton = { label: 'Close', primary: state!=='error' && enabled, onClick: onClose }
        const buttons:Array<ButtonProps> = [closeButton];

        if (!loading) {
            if (!enabled) {
                buttons.push({ label: 'Enable', primary: true, onClick: onEnable });
            } else if (state === 'error' && needsPermissions) {
                buttons.push({ label: 'Grant Permissions', primary: true, onClick: onRequestPermissions });
            }
            else if (enabled && state!=='error') {
                buttons.push({ label: 'Disable', primary: false, onClick: onDisable });
            }
        }
        if (buttons.length===1) {
            buttons[0].primary = true
        }

        return buttons;
    };

    const renderContent = () => {
        if (loading)
            return null
        if (!enabled) {
            return (
                <Text style={styles.text}>
                    {'You have disabled Bluetooth scanning. \n\nThe app will not be able to find sensors.'}
                </Text>
            );
        }

        if (state === 'error' && needsPermissions) {
            return (
                <Text style={styles.text}>
                    {'Bluetooth permissions are missing. \n\nThese are required to scan for and connect to your training devices.'}
                </Text>
            );
        }

        if (state === 'error') {
            return <Text style={[styles.text ]}>{'Bluetooth is disabled on your device. \n\nThe app will not be able to find sensors.'}</Text>;
        }

        return <Text style={styles.text}>Bluetooth is active</Text>;
    };

    return (
        <Dialog 
            title="Bluetooth Settings"
            height={Math.min(height-100, 400)}
            onOutsideClick={onClose}
            buttons={getButtons()}
        >
            <View style={styles.container}>
                {renderContent()}
            </View>
        </Dialog>
    );
};

