import React, { FC, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import DeviceEntry from '../DeviceEntry';
import { ConflictStepProps, DeviceSelectionItemProps, DeviceSelectionProps } from 'incyclist-services';
import { colors, textSizes } from '../../theme';
import { useScreenLayout } from '../../hooks';
import { Dialog } from '../Dialog';
import { ButtonProps } from '../ButtonBar/types';
import { ConflictStepRows } from '../ConflictStepRows';

const DONE_LABEL = 'Done';

interface ConflictStepBodyProps {
    step: ConflictStepProps
    compact: boolean
}

// the list's second step: which device each slot held by another device should use
const ConflictStepBody = ({ step, compact }: ConflictStepBodyProps) => (
    <View style={styles.stepView}>
        <Text style={styles.stepSubline}>{compact ? step.subline.short : step.subline.full}</Text>
        <ConflictStepRows rows={step.rows} onChoice={step.onChoice} />
    </View>
);

/**
 * The device list of one capability. After a pick in the Resistance list that would take slots held
 * by a different device, the page service sends a conflict step: it replaces the list in the same
 * dialog until Done, or a tap outside / the back button, which both apply the choices made so far.
 */
export const DeviceSelector: FC<DeviceSelectionProps> = ({
  devices,
  isScanning,
  conflictStep,
  onClose,
}) => {
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const compact = useScreenLayout() === 'compact';

    const targetWidth = textSizes.listEntry * 0.6 * 40; // ~288dp
    const dialogWidth = Math.min(0.9 * screenWidth, targetWidth);
    const minHeightLeft = screenHeight - (textSizes.dialogTitle + 100 + 80 + 8);
    const deviceListMinHeight = Math.min(380, minHeightLeft);

    const onDeviceClicked = (device: DeviceSelectionItemProps) => {
        device.onClick?.();
    };

    const onOutsideClick = useCallback(() => {
        if (conflictStep)
            conflictStep.onDismiss();
        else
            onClose();
    }, [conflictStep, onClose]);

    const stepButtons = useMemo<ButtonProps[] | undefined>(() => conflictStep
        ? [{ id: 'conflict-done', label: DONE_LABEL, primary: true, onClick: conflictStep.onDone }]
        : undefined
    , [conflictStep]);

    const dialogStyle = [styles.dialog, { width: dialogWidth }];
    const deviceListStyle = [styles.deviceList, { minHeight: deviceListMinHeight }];

    let title = isScanning ? 'Searching ...' : 'Select Device';
    if (conflictStep)
        title = conflictStep.title;

    return (
        <Dialog
            style={dialogStyle}
            title={title}
            onOutsideClick={onOutsideClick}
            buttons={stepButtons}
            scrollable={Boolean(conflictStep)}
        >
            {conflictStep ? (
                <ConflictStepBody step={conflictStep} compact={compact} />
            ) : (
                <View style={styles.modalView}>
                    <ScrollView style={deviceListStyle}>
                        {devices.map((device) => (
                            <DeviceEntry
                                key={`${device.deviceName}-${device.interface}`}
                                {...device}
                                onClick={() => onDeviceClicked(device)}
                            />
                        ))}
                    </ScrollView>
                </View>
            )}
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
        // No explicit height here: with Dialog's `scrollable={false}`, this View's parent has a
        // definite (flex-resolved) height, so `flex: 1` alone reliably fills it. A `height: '100%'`
        // is unnecessary and, if this were ever nested back inside a ScrollView, would resolve
        // against an undefined parent size (see Dialog's `scrollable` prop doc).
    },
    deviceList: {
        flex: 1,
        maxHeight: 380,
        // Dynamic minHeight applied via inline style
    },
    stepView: {
        paddingHorizontal: 8,
        paddingTop: 4,
    },
    stepSubline: {
        color: colors.text,
        fontSize: textSizes.smallText,
        marginBottom: 10,
    },
});
