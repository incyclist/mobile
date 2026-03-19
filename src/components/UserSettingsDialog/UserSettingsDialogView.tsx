import React from 'react';
import { View, StyleSheet } from 'react-native';
import { UserSettingsDisplayProps } from 'incyclist-services';
import { Dialog } from '../Dialog/Dialog';
import { EditText, EditNumber, SingleSelect } from '../atoms';

export type UserSettingsDialogViewProps = {
    displayProps: UserSettingsDisplayProps | null;
    onClose: () => void;
};

const LABEL_WIDTH = 80;

/**
 * UserSettingsDialogView (Pure Component)
 * 
 * Renders the user profile editing form within a Dialog.
 * Uses atom components for input fields.
 */
export const UserSettingsDialogView = ({ displayProps, onClose }: UserSettingsDialogViewProps) => {
    return (
        <Dialog
            title="User Settings"
            variant="details"
            visible={true}
            onOutsideClick={onClose}
            buttons={[{ label: 'OK', primary: true, onClick: onClose }]}
        >
            <View style={styles.container}>
                {displayProps && (
                    <View style={styles.fields}>
                        <EditText
                            label="Name"
                            labelWidth={LABEL_WIDTH}
                            value={displayProps.username}
                            onValueChange={displayProps.onChangeName}
                        />
                        <EditNumber
                            label="FTP"
                            labelWidth={LABEL_WIDTH}
                            value={displayProps.ftp}
                            unit="W"
                            digits={0}
                            onValueChange={(v) => { if (v !== undefined) displayProps.onChangeFtp(v); }}
                        />
                        <EditNumber
                            label="Weight"
                            labelWidth={LABEL_WIDTH}
                            value={displayProps.weight?.value}
                            unit={displayProps.weight?.unit}
                            digits={1}
                            onValueChange={(v) => { if (v !== undefined) displayProps.onChangeWeight(v); }}
                        />
                        <SingleSelect
                            label="Units"
                            labelWidth={LABEL_WIDTH}
                            options={displayProps.unitsOptions}
                            selected={displayProps.units}
                            onValueChange={displayProps.onChangeUnits}
                        />
                    </View>
                )}
            </View>
        </Dialog>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        paddingTop: 8,
    },
    fields: {
        marginBottom: 16,
    },
});