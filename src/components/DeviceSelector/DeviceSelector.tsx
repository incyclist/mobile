import React, { FC, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import DeviceEntry from '../DeviceEntry';
import { DeviceSelectionItemProps, DeviceSelectionProps } from 'incyclist-services';
import { textSizes } from '../../theme';
import { useScreenLayout } from '../../hooks';
import { Dialog } from '../Dialog';
import { ButtonProps } from '../ButtonBar/types';
import { ConflictStepBody, getConflictQueuedNote } from '../ConflictStepRows';
import { getConflictDialogStyle, getDeviceDialogWidth } from './utils';

const DONE_LABEL = 'Done';

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

    const dialogWidth = getDeviceDialogWidth(screenWidth);
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

    const dialogStyle = [styles.dialog, conflictStep ? getConflictDialogStyle(screenWidth, compact) : { width: dialogWidth }];
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
            footerNote={conflictStep ? getConflictQueuedNote(conflictStep.queued, compact) : undefined}
            // the list and the conflict step both scroll on their own
            scrollable={false}
        >
            {conflictStep ? (
                <ConflictStepBody step={conflictStep} compact={compact} onChoice={conflictStep.onChoice} />
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
});
