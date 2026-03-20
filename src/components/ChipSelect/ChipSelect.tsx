import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { textSizes } from '../../theme/textSizes';
import { ChipSelectProps } from './types';
import { useLogging } from '../../hooks';

const LABEL_MARGIN = 8;

/**
 * ChipSelect component
 * 
 * A reusable labelled row of chips for selecting one option from a small set.
 */
export const ChipSelect = ({
    label,
    options,
    selected,
    labelWidth = 100,
    disabled = false,
    onValueChange,
}: ChipSelectProps) => {
    const [selectedValue, setSelectedValue] = useState(selected);
    const { logEvent } = useLogging('ChipSelect');

    useEffect(() => {
        setSelectedValue(selected);
    }, [selected]);

    const handleSelect = (option: string) => {
        if (disabled) return;
        setSelectedValue(option);
        logEvent({
            message: 'option selected',
            field: label,
            value: option,
            eventSource: 'user',
        });
        onValueChange?.(option);
    };

    const labelStyle = { width: labelWidth };

    return (
        <View style={[styles.container, disabled && styles.disabled]}>
            <View style={styles.row}>
                <Text style={[styles.label, labelStyle]}>{label}</Text>
                <View style={styles.chipsContainer}>
                    {options.map((option, index) => {
                        const isSelected = selectedValue === option;
                        const isLast = index === options.length - 1;

                        return (
                            <TouchableOpacity
                                key={option}
                                style={[
                                    styles.chip,
                                    isSelected && styles.chipActive,
                                    !isLast && styles.marginRight,
                                ]}
                                onPress={() => handleSelect(option)}
                                disabled={disabled}
                            >
                                <Text style={styles.chipText}>{option}</Text>
                            </TouchableOpacity>
                        );
                    })}
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
    disabled: {
        opacity: 0.4,
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
    chipsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'nowrap',
    },
    chip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    chipActive: {
        backgroundColor: colors.buttonPrimary,
    },
    chipText: {
        color: colors.text,
        fontSize: textSizes.smallText,
        fontWeight: '600',
    },
    marginRight: {
        marginRight: 8,
    },
});