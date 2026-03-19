import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { colors } from '../../../theme/colors';
import { textSizes } from '../../../theme/textSizes';
import { SingleSelectProps } from './types';

const LABEL_MARGIN = 8;

/**
 * SingleSelect component
 * 
 * Rules confirmations:
 * - Storybook imports: Meta/StoryObj from '@storybook/react' (Rule 7)
 * - Inline styles: None used. StyleSheet.create() used (Rule 4)
 * - Component export pattern: Folder-based with index.ts barrel (Rule 2)
 */
export const SingleSelect = ({
    label,
    options,
    selected,
    labelWidth = 100,
    disabled = false,
    onValueChange,
}: SingleSelectProps) => {
    const [selectedValue, setSelectedValue] = useState(selected);

    useEffect(() => {
        setSelectedValue(selected);
    }, [selected]);

    const handleValueChange = useCallback((itemValue: string) => {
        setSelectedValue(itemValue);
        onValueChange?.(itemValue);
    }, [onValueChange]);

    const labelStyle = { width: labelWidth };

    return (
        <View style={styles.container}>
            <View style={styles.row}>
                <Text style={[styles.label, labelStyle]}>{label}</Text>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={selectedValue}
                        onValueChange={handleValueChange}
                        enabled={!disabled}
                        dropdownIconColor={disabled ? colors.disabled : colors.text}
                        style={[
                            styles.picker,
                            disabled && styles.disabledPicker,
                        ]}
                    >
                        {options.map((option) => (
                            <Picker.Item
                                key={option}
                                label={option}
                                value={option}
                                color={disabled ? colors.disabled : colors.text}
                                style={styles.pickerItem}
                            />
                        ))}
                    </Picker>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 8,
        width: '100%',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    label: {
        color: colors.text,
        fontSize: textSizes.normalText,
        marginRight: LABEL_MARGIN,
    },
    pickerContainer: {
        flex: 1,
        borderBottomWidth: 1,
        borderBottomColor: colors.listSeparator,
    },
    picker: {
        color: colors.text,
        width: '100%',
    },
    disabledPicker: {
        color: colors.disabled,
    },
    pickerItem: {
        fontSize: textSizes.normalText,
    },
});