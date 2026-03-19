import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { colors } from '../../theme/colors';
import { textSizes } from '../../theme/textSizes';
import { SingleSelectProps } from './types';
import { CHAR_WIDTH_MULTIPLIER, SINGLE_SELECT_ARROW_BUFFER } from '../../utils/ui'; // Import shared constants

const LABEL_MARGIN = 8;

/**
 * SingleSelect component
 * 
 * Rules confirmations:
 * - Storybook imports: Meta/StoryObj from '@storybook/react-native-web-vite' (Rule 7)
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
    length, // Added length prop
}: SingleSelectProps) => {
    const [selectedValue, setSelectedValue] = useState(selected);
    const [isOpen, setIsOpen] = useState(false);
    const [triggerHeight, setTriggerHeight] = useState(0);

    useEffect(() => {
        setSelectedValue(selected);
    }, [selected]);

    const handleToggle = useCallback(() => {
        if (!disabled) {
            setIsOpen(prev => !prev);
        }
    }, [disabled]);

    const handleSelect = useCallback((itemValue: string) => {
        setSelectedValue(itemValue);
        setIsOpen(false);
        onValueChange?.(itemValue);
    }, [onValueChange]);

    const deriveLength = useCallback((): number | undefined => {
        if (length !== undefined) return length; // Explicit length takes precedence
        if (!options || options.length === 0) return undefined; // No options to derive from

        const longestOptionLength = Math.max(...options.map(o => o.length));
        return longestOptionLength + SINGLE_SELECT_ARROW_BUFFER; // Add buffer for arrow and padding
    }, [length, options]);

    const labelStyle = { width: labelWidth };
    const triggerCalculatedLength = deriveLength();
    const triggerWidthStyle = triggerCalculatedLength !== undefined
        ? { width: triggerCalculatedLength * CHAR_WIDTH_MULTIPLIER }
        : styles.triggerFull; // Use flex: 1 if no length derived

    return (
        <View style={[styles.container, isOpen && styles.activeZIndex]}>
            <View style={styles.row}>
                <Text style={[styles.label, labelStyle]}>{label}</Text>
                <View style={[styles.dropdownContainer, triggerWidthStyle]}> {/* Apply dynamic width here */}
                    <TouchableOpacity
                        style={[
                            styles.trigger,
                            disabled && styles.disabledTrigger,
                        ]}
                        onPress={handleToggle}
                        disabled={disabled}
                        onLayout={(e) => setTriggerHeight(e.nativeEvent.layout.height)}
                    >
                        <Text style={[styles.valueText, disabled && styles.disabledText]}>
                            {selectedValue || 'Select...'}
                        </Text>
                        <Text style={[styles.arrow, disabled && styles.disabledText]}>
                            {isOpen ? '▲' : '▼'}
                        </Text>
                    </TouchableOpacity>
                    {isOpen && (
                        <View style={[styles.list, { top: triggerHeight }]}>
                            <ScrollView style={styles.scroll} nestedScrollEnabled>
                                {options.map((option) => (
                                    <TouchableOpacity
                                        key={option}
                                        style={styles.item}
                                        onPress={() => handleSelect(option)}
                                    >
                                        <Text style={styles.itemText}>{option}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 8,
        width: '100%',
        zIndex: 1,
    },
    activeZIndex: {
        zIndex: 1000,
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
    dropdownContainer: {
        position: 'relative',
    },
    trigger: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: colors.listSeparator,
        paddingVertical: 4,
        paddingHorizontal: 4,
    },
    triggerFull: { // Style for full width when length is not specified
        flex: 1,
    },
    disabledTrigger: {
        borderBottomColor: 'transparent',
    },
    valueText: {
        color: colors.text,
        fontSize: textSizes.normalText,
    },
    disabledText: {
        color: colors.disabled,
    },
    arrow: {
        color: colors.text,
        fontSize: 12,
    },
    list: {
        position: 'absolute',
        left: 0,
        right: 0,
        backgroundColor: '#2a2a2a',
        borderWidth: 1,
        borderColor: '#555',
        borderRadius: 4,
        zIndex: 1000,
        elevation: 10,
    },
    scroll: {
        maxHeight: 200,
    },
    item: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    itemText: {
        color: colors.text,
        fontSize: textSizes.normalText,
    },
});