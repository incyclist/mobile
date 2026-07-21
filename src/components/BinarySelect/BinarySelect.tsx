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
        labelWidth,
    } = props;

    const options = [trueLabel, falseLabel];
    const selected = value ? trueLabel : falseLabel;

    const handleValueChange = (v: string) => {
        onValueChange(v === trueLabel);
    };

    const isBefore = labelPosition === 'before';
    const labelWidthStyle = labelWidth !== undefined ? { width: labelWidth } : undefined;

    // Opt-in path: when a caller aligns this with other ChipSelect-based fields (e.g.
    // EditNumber/GroupPicker in a stacked form) via `labelWidth`, delegate entirely to
    // ChipSelect's own label+chips row instead of the manual Text+nested-ChipSelect
    // composition below. The manual composition double-wraps a ChipSelect (which carries
    // its own `marginVertical` box model) inside a second, differently-spaced label row,
    // so its vertical rhythm never quite matches a bare ChipSelect/GroupPicker row even
    // once the label column width lines up. Only safe for `labelPosition:'before'` —
    // ChipSelect has no trailing-label mode, so `'after'` (DeviceSelector) keeps the
    // manual composition regardless of `labelWidth`.
    if (isBefore && labelWidth !== undefined) {
        return (
            <ChipSelect
                label={label}
                labelWidth={labelWidth}
                options={options}
                selected={selected}
                onValueChange={handleValueChange}
                disabled={disabled}
            />
        );
    }

    return (
        <View style={[styles.container, !isBefore && styles.rowReverse]}>
            <Text style={[styles.label, isBefore ? styles.flexLabel : styles.marginLeft, labelWidthStyle]}>
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