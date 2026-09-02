import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { textSizes } from '../../theme/textSizes';
import { ChipSelectProps } from './types';
import { normalizeChipOption } from './utils';
import { useLogging } from '../../hooks';

const LABEL_MARGIN = 8;

/**
 * ChipSelect component
 *
 * A reusable labelled row of chips for selecting one or more options from a small set.
 *
 * Each option may be a plain string, or an object carrying a per-option `disabled`
 * state and a `message` explaining why — a disabled option renders greyed out,
 * cannot be selected, and shows its message as a caption below the chip.
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
                        const normalized = normalizeChipOption(option);
                        const optionDisabled = disabled || !!normalized.disabled;
                        const isSelected = props.multi
                            ? selectedValues.includes(normalized.label)
                            : selectedValue === normalized.label;
                        const isLast = index === options.length - 1;

                        return (
                            <View
                                key={normalized.label}
                                style={[styles.chipColumn, !isLast && styles.marginRight]}
                            >
                                <TouchableOpacity
                                    style={[
                                        styles.chip,
                                        isSelected && styles.chipActive,
                                        normalized.disabled && styles.chipDisabled,
                                    ]}
                                    onPress={() => handleSelect(normalized.label)}
                                    disabled={optionDisabled}
                                >
                                    <Text style={styles.chipText}>{normalized.label}</Text>
                                </TouchableOpacity>
                                {normalized.disabled && normalized.message && (
                                    <Text style={styles.helperText}>{normalized.message}</Text>
                                )}
                            </View>
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
        alignItems: 'flex-start',
        flexWrap: 'nowrap',
    },
    chipColumn: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        maxWidth: 140,
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
    chipDisabled: {
        opacity: 0.4,
    },
    chipText: {
        color: colors.text,
        fontSize: textSizes.smallText,
        fontWeight: '600',
    },
    helperText: {
        color: colors.text,
        fontSize: textSizes.tinyText,
        opacity: 0.7,
        marginTop: 4,
    },
    marginRight: {
        marginRight: 8,
    },
});
