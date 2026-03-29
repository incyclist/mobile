import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ChipSelect } from '../ChipSelect';
import { BinarySelectProps } from './types';
import { colors } from '../../theme/colors';
import { textSizes } from '../../theme/textSizes';

/**
 * BinarySelect component
 *
 * A reusable toggle component for boolean values, implemented using ChipSelect.
 * Supports positioning the label before or after the toggle chips.
 */
export const BinarySelect = (props: BinarySelectProps) => {
    const {
        label,
        value,
        onValueChange,
        labelPosition = 'before',
        trueLabel = 'Yes',
        falseLabel = 'No',
        disabled = false,
    } = props;

    const options = [trueLabel, falseLabel];
    const selected = value ? trueLabel : falseLabel;

    const handleValueChange = (v: string) => {
        onValueChange(v === trueLabel);
    };

    const isBefore = labelPosition === 'before';

    return (
        <View style={[styles.container, !isBefore && styles.rowReverse]}>
            <Text style={[styles.label, isBefore ? styles.flexLabel : styles.marginLeft]}>
                {label}
            </Text>
            <View style={styles.chipsWrapper}>
                <ChipSelect
                    label="" // Fix: Pass empty string to prevent duplicate label rendering
                    labelWidth={0}
                    options={options}
                    selected={selected}
                    onValueChange={handleValueChange}
                    disabled={disabled}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rowReverse: {
        flexDirection: 'row-reverse',
        justifyContent: 'flex-end',
    },
    label: {
        color: colors.text,
        fontSize: textSizes.normalText,
    },
    flexLabel: {
        marginRight: 8,
    },
    marginLeft: {
        marginLeft: 8,
    },
    chipsWrapper: {
        justifyContent: 'center',
    },
});