import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SelectOption } from 'incyclist-services';
import { colors } from '../../theme/colors';
import { textSizes } from '../../theme/textSizes';
import { SingleSelectProps } from './types';
import { Icon } from '../Icon'; // Path changed from '../../Icon' to '../Icon'

export const SingleSelect = ({ label, labelWidth, options, selected, onValueChange }: SingleSelectProps) => {
    const selectedOption = options.find(opt => opt.value === selected);

    return (
        <View style={styles.container}>
            {label && <Text style={[styles.label, { width: labelWidth }]}>{label}</Text>}
            <Pressable style={styles.picker} onPress={() => {
                // In a real app, this would open a modal or dropdown
                // For storybook/simple demonstration, let's just cycle
                const currentIndex = options.findIndex(opt => opt.value === selected);
                const nextIndex = (currentIndex + 1) % options.length;
                onValueChange(options[nextIndex].value);
            }}>
                <Text style={styles.selectedValue}>{selectedOption ? selectedOption.label : 'Select...'}</Text>
                <Icon name="chevron-down" size={20} color={colors.text} />
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    label: {
        color: colors.text,
        fontSize: textSizes.normalText,
        marginRight: 8,
    },
    picker: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 40,
        backgroundColor: colors.background,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: colors.text,
        paddingHorizontal: 10,
    },
    selectedValue: {
        color: colors.text,
        fontSize: textSizes.normalText,
    },
});