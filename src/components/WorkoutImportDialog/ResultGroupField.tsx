import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { colors, textSizes } from '../../theme';
import { useLogging } from '../../hooks';

const NEW_GROUP_OPTION = '+ New';

interface ResultGroupFieldProps {
    label: string;
    groups: string[];
    value: string;
    onValueChange: (group: string) => void;
}

/**
 * Group field for the import result phase — deliberately NOT `GroupPicker`.
 * `GroupPicker`'s many-groups fallback (`SingleSelect`) renders its option
 * list as a `position: 'absolute'` overlay, which gets clipped to invisible
 * inside `Dialog` (every variant wraps content in an `overflow: 'hidden'`
 * container — verified via Storybook screenshot). This component instead
 * renders its expanded option list in normal document flow, so it can never
 * be clipped — it just extends the Dialog's own scrollable content area,
 * same as any other row would.
 */
export const ResultGroupField = ({ label, groups, value, onValueChange }: ResultGroupFieldProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isEditingNew, setIsEditingNew] = useState(false);
    const [newGroup, setNewGroup] = useState('');
    const { logEvent } = useLogging('WorkoutImportDialog');

    const known = groups.includes(value) || !value ? groups : [...groups, value];
    const options = [...known, NEW_GROUP_OPTION];

    const handleToggle = useCallback(() => {
        setIsExpanded((prev) => !prev);
    }, []);

    const handleSelect = useCallback(
        (group: string) => {
            if (group === NEW_GROUP_OPTION) {
                setNewGroup('');
                setIsEditingNew(true);
                return;
            }
            setIsExpanded(false);
            logEvent({ message: 'group selected', field: label, value: group, eventSource: 'user' });
            onValueChange(group);
        },
        [label, logEvent, onValueChange]
    );

    const handleCommitNew = useCallback(() => {
        const trimmed = newGroup.trim();
        setIsEditingNew(false);
        setIsExpanded(false);
        if (!trimmed || trimmed === value) return;
        logEvent({ message: 'group entered', field: label, value: trimmed, eventSource: 'user' });
        onValueChange(trimmed);
    }, [newGroup, value, label, logEvent, onValueChange]);

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.trigger} onPress={handleToggle}>
                <Text style={styles.label}>{label}</Text>
                <Text style={styles.value}>{value}</Text>
                <Text style={styles.arrow}>{isExpanded ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {isExpanded && !isEditingNew && (
                <View style={styles.list}>
                    {options.map((option) => (
                        <TouchableOpacity key={option} style={styles.item} onPress={() => handleSelect(option)}>
                            <Text style={[styles.itemText, option === value && styles.itemTextSelected]}>
                                {option}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {isEditingNew && (
                <TextInput
                    style={styles.input}
                    value={newGroup}
                    onChangeText={setNewGroup}
                    onSubmitEditing={handleCommitNew}
                    onBlur={handleCommitNew}
                    placeholder="New group name"
                    placeholderTextColor={colors.disabled}
                    autoFocus
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    trigger: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: colors.listSeparator,
        paddingVertical: 6,
    },
    label: {
        color: colors.text,
        fontSize: textSizes.normalText,
        marginRight: 8,
    },
    value: {
        flex: 1,
        color: colors.text,
        fontSize: textSizes.normalText,
        fontWeight: '700',
    },
    arrow: {
        color: colors.text,
        fontSize: 12,
    },
    list: {
        backgroundColor: colors.listItemBackground,
        borderRadius: 8,
        marginTop: 4,
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
    itemTextSelected: {
        color: colors.buttonPrimary,
        fontWeight: '700',
    },
    input: {
        color: colors.text,
        fontSize: textSizes.normalText,
        borderBottomWidth: 1,
        borderBottomColor: colors.listSeparator,
        paddingVertical: 4,
        marginTop: 4,
    },
});
