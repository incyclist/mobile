import React, { useCallback, useMemo, useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { RideViewDeviceOption } from 'incyclist-services';
import { Dialog } from '../Dialog';
import { BinarySelect } from '../BinarySelect';
import { ButtonProps } from '../ButtonBar/types';
import { colors, textSizes } from '../../theme';
import { RideViewRestrictionDialogComponentProps } from './types';

const REMINDER_LABEL_WIDTH = 220;

/**
 * Explains why Street View and Satellite View are not available in a simulated ride and how to
 * get them. Mobile only offers to ride with a device (an own Maps key is not possible with the
 * native SDK), so only the device option is rendered here.
 *
 * Discarding always asks for one confirmation, inside this dialog: the buttons are replaced.
 */
export const RideViewRestrictionDialog = ({ dialog, onClose, onDiscard, onReminderChanged }: RideViewRestrictionDialogComponentProps) => {
    const [confirming, setConfirming] = useState(false);

    const device = dialog.options.find((option): option is RideViewDeviceOption => option.id === 'device');
    const discard = device?.discard;

    const startConfirm = useCallback(() => setConfirming(true), []);
    const cancelConfirm = useCallback(() => setConfirming(false), []);

    const buttons = useMemo<ButtonProps[]>(() => {
        if (discard && confirming) {
            return [
                { label: discard.confirm.confirmLabel, attention: true, onClick: onDiscard },
                { label: discard.confirm.cancelLabel, primary: true, onClick: cancelConfirm },
            ];
        }
        const list: ButtonProps[] = [];
        if (discard)
            list.push({ label: discard.label, onClick: startConfirm });
        list.push({ label: 'Close', primary: true, onClick: onClose });
        return list;
    }, [discard, confirming, onDiscard, onClose, startConfirm, cancelConfirm]);

    return (
        <Dialog title={dialog.title} variant="details" onOutsideClick={onClose} buttons={buttons}>
            <Text style={styles.text}>{dialog.body}</Text>
            {device ? <Text style={styles.text}>{device.text}</Text> : null}
            {dialog.reminder ? (
                <BinarySelect
                    label={dialog.reminder.label}
                    labelWidth={REMINDER_LABEL_WIDTH}
                    value={dialog.reminder.checked}
                    onValueChange={onReminderChanged}
                />
            ) : null}
            {discard && confirming ? <Text style={styles.question}>{discard.confirm.question}</Text> : null}
        </Dialog>
    );
};

const styles = StyleSheet.create({
    text: {
        color: colors.text,
        fontSize: textSizes.normalText,
        marginBottom: 12,
    },
    question: {
        color: colors.text,
        fontSize: textSizes.normalText,
        fontWeight: '700',
        marginTop: 4,
    },
});
