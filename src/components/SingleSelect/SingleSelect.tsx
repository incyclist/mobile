import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, ScrollView, Modal } from 'react-native';
import { colors } from '../../theme/colors';
import { textSizes } from '../../theme/textSizes';
import { SingleSelectProps } from './types';
import { CHAR_WIDTH_MULTIPLIER, SINGLE_SELECT_ARROW_BUFFER } from '../../utils/ui'; // Import shared constants
import { useLogging } from '../../hooks';

const LABEL_MARGIN = 8;

/**
 * SingleSelect component
 *
 * The option list renders in a `Modal` rather than as a `position: 'absolute'`
 * overlay: absolute + zIndex only reorders siblings that share the same
 * parent, so it can't guarantee paint/touch priority over unrelated content
 * elsewhere on screen — e.g. a Dialog's own overflow-clipped scroll area (the
 * original bug this component had), or a sibling scrollable list if this
 * component is ever placed next to one (see FilterPanel's identical fix).
 * `Modal` owns its own native window layer, sidestepping that ambiguity.
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
    const triggerRef = useRef<View>(null);
    const [triggerLayout, setTriggerLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
    const {logEvent} = useLogging('Incyclist')

    useEffect(() => {
        setSelectedValue(selected);
    }, [selected]);

    const handleToggle = useCallback(() => {
        if (disabled) return;
        if (isOpen) {
            setIsOpen(false);
            return;
        }
        triggerRef.current?.measureInWindow((x, y, width, height) => {
            setTriggerLayout({ x, y, width, height });
        });
        setIsOpen(true);
    }, [disabled, isOpen]);

    const handleSelect = useCallback((itemValue: string) => {
        setSelectedValue(itemValue);
        setIsOpen(false);
        logEvent( {message:'option selected', field:label, option:itemValue, eventSource:'user'})
        onValueChange?.(itemValue);
    }, [label, logEvent, onValueChange]);

    const deriveLength = useCallback((): number | undefined => {
        if (length !== undefined) return length; // Explicit length takes precedence
        if (!options || options.length === 0) return undefined; // No options to derive from

        const longestOptionLength = Math.max(...options.map(o => o.length));
        return longestOptionLength + SINGLE_SELECT_ARROW_BUFFER; // Add buffer for arrow and padding
    }, [length, options]);

    // `options` can be transiently undefined despite the required prop type
    // (e.g. a caller with data not yet loaded). The list below renders inside
    // a Modal, whose children mount on every render regardless of `visible`
    // — so this must never crash even while closed (see deriveLength's own
    // `!options` guard above, which anticipates the same thing).
    const safeOptions = options ?? [];

    const labelStyle = { width: labelWidth };
    const triggerCalculatedLength = deriveLength();
    const triggerWidthStyle = triggerCalculatedLength !== undefined
        ? { width: triggerCalculatedLength * CHAR_WIDTH_MULTIPLIER }
        : styles.triggerFull; // Use flex: 1 if no length derived

    return (
        <View style={styles.container}>
            <View style={styles.row}>
                <Text style={[styles.label, labelStyle]}>{label}</Text>
                <View style={[styles.dropdownContainer, triggerWidthStyle]}> {/* Apply dynamic width here */}
                    <TouchableOpacity
                        ref={triggerRef}
                        style={[
                            styles.trigger,
                            disabled && styles.disabledTrigger,
                        ]}
                        onPress={handleToggle}
                        disabled={disabled}
                    >
                        <Text style={[styles.valueText, disabled && styles.disabledText]}>
                            {selectedValue || 'Select...'}
                        </Text>
                        <Text style={[styles.arrow, disabled && styles.disabledText]}>
                            {isOpen ? '▲' : '▼'}
                        </Text>
                    </TouchableOpacity>
                    <Modal
                        transparent
                        visible={isOpen}
                        animationType="none"
                        presentationStyle="overFullScreen"
                        supportedOrientations={['landscape']}
                        onRequestClose={() => setIsOpen(false)}
                    >
                        <TouchableWithoutFeedback onPress={() => setIsOpen(false)}>
                            <View style={styles.modalBackdrop}>
                                <TouchableWithoutFeedback>
                                    <ScrollView
                                        style={[
                                            styles.list,
                                            {
                                                top: triggerLayout.y + triggerLayout.height,
                                                left: triggerLayout.x,
                                                width: triggerLayout.width,
                                            },
                                        ]}
                                        keyboardShouldPersistTaps="handled"
                                    >
                                        {safeOptions.map((option) => (
                                            <TouchableOpacity
                                                key={option}
                                                style={styles.item}
                                                onPress={() => handleSelect(option)}
                                            >
                                                <Text style={styles.itemText}>{option}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </TouchableWithoutFeedback>
                            </View>
                        </TouchableWithoutFeedback>
                    </Modal>
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
    // Fills the Modal's own window; position/size of the actual list below
    // is set inline per-instance from the trigger's measured window coords.
    modalBackdrop: { flex: 1 },
    list: {
        position: 'absolute',
        maxHeight: 200,
        backgroundColor: '#2a2a2a',
        borderWidth: 1,
        borderColor: '#555',
        borderRadius: 4,
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