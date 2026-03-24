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
 * A reusable labelled row of chips for selecting one or more options from a small set.
 */
export const ChipSelect = (props: ChipSelectProps) => {
    const { label, options, labelWidth = 100, disabled = false } = props;
    const { logEvent } = useLogging('ChipSelect');

    const [selectedValue, setSelectedValue] = useState<string | undefined>(
        props.multi ? undefined : props.selected
    );
    const [selectedValues, setSelectedValues] = useState<string[]>(
        props.multi ? (props.selectedValues ?? []) : []
    );

    const singleSelected = !props.multi ? props.selected : undefined;
    const multiSelectedValues = props.multi ? props.selectedValues : undefined;

    useEffect(() => {
        if (!props.multi) {
            setSelectedValue(singleSelected);
        }
    }, [props.multi, singleSelected]);

    useEffect(() => {
        if (props.multi) {
            setSelectedValues(multiSelectedValues ?? []);
        }
    }, [props.multi, multiSelectedValues]);

    const handleSelect = (option: string) => {
        if (disabled) return;

        if (props.multi) {
            const updated = selectedValues.includes(option)
                ? selectedValues.filter((v) => v !== option)
                : [...selectedValues, option];

            setSelectedValues(updated);
            logEvent({
                message: 'option selected',
                field: label,
                value: option,
                eventSource: 'user',
            });
            props.onValueChange?.(updated);
        } else {
            setSelectedValue(option);
            logEvent({
                message: 'option selected',
                field: label,
                value: option,
                eventSource: 'user',
            });
            props.onValueChange?.(option);
        }
    };

    const labelStyle = { width: labelWidth };

    return (
        <View style={[styles.container, disabled && styles.disabled]}>
            <View style={styles.row}>
                <Text style={[styles.label, labelStyle]}>{label}</Text>
                <View style={styles.chipsContainer}>
                    {options.map((option, index) => {
                        const isSelected = props.multi
                            ? selectedValues.includes(option)
                            : selectedValue === option;
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