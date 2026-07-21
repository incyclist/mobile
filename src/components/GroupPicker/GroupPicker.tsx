import React, { useCallback, useState } from 'react';
import { View, TextInput, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors } from '../../theme';
import { textSizes } from '../../theme/textSizes';
import { useLogging } from '../../hooks';
import { ChipSelect } from '../ChipSelect';
import { GroupPickerProps } from './types';

// Same threshold `RouteDetailsView` uses for its segment picker
// (SEGMENT_CHIP_THRESHOLD) — ChipSelect's chip row never wraps
// (`ChipSelect.tsx`'s `flexWrap: 'nowrap'`), so past this many options chips
// start overflowing off-screen and an inline-expanding list reads better.
const GROUP_CHIP_THRESHOLD = 5;

// Rendered as a literal trailing option in ChipSelect, not a separate button
// — sits inline with the real groups instead of floating off to the side.
const NEW_GROUP_OPTION = '+ New';

/**
 * Shared group-selection UI (workout-mobile-hld.md §3.1): pick an existing
 * group — via `ChipSelect` (≤5 groups) or inline-expanding list (>5 groups) —
 * or pick "+ New" to free-type one. For >5 groups, renders the option list
 * in normal document flow (never clipped inside Dialog), unlike SingleSelect's
 * position: absolute overlay. Used by WorkoutImportDialog and WorkoutsTable.
 */
export const GroupPicker = (props: GroupPickerProps) => {
    const { label, groups, value, disabled = false, allowNew = true, onValueChange } = props;
    const [isEditing, setIsEditing] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [newGroup, setNewGroup] = useState('');
    const { logEvent } = useLogging('GroupPicker');

    // The current value is always offered as an option, even when it isn't
    // (yet) one of the known groups — e.g. a just-typed new name before it's persisted.
    const known = groups.includes(value) || !value ? groups : [...groups, value];
    const options = allowNew ? [...known, NEW_GROUP_OPTION] : known;
    const useChips = known.length <= GROUP_CHIP_THRESHOLD;

    const handleSelect = useCallback(
        (group: string) => {
            if (group === NEW_GROUP_OPTION) {
                setNewGroup('');
                setIsEditing(true);
                setIsExpanded(false);
                return;
            }
            logEvent({ message: 'group selected', field: label ?? 'Group', value: group, eventSource: 'user' });
            onValueChange(group);
            setIsExpanded(false);
        },
        [onValueChange, label, logEvent]
    );

    const handleCommitNew = useCallback(() => {
        const trimmed = newGroup.trim();
        setIsEditing(false);
        setIsExpanded(false);
        if (!trimmed || trimmed === value) return;
        logEvent({ message: 'group entered', field: label ?? 'Group', value: trimmed, eventSource: 'user' });
        onValueChange(trimmed);
    }, [newGroup, value, label, logEvent, onValueChange]);

    const handleToggleExpand = useCallback(() => {
        if (!disabled) {
            setIsExpanded((prev) => !prev);
        }
    }, [disabled]);

    if (isEditing) {
        return (
            <View style={styles.container}>
                <TextInput
                    style={styles.input}
                    value={newGroup}
                    onChangeText={setNewGroup}
                    onSubmitEditing={handleCommitNew}
                    onBlur={handleCommitNew}
                    placeholder="New group name"
                    placeholderTextColor={colors.disabled}
                    autoFocus
                    editable={!disabled}
                />
            </View>
        );
    }

    if (useChips) {
        return (
            <View style={styles.container}>
                <ChipSelect
                    label={label ?? ''}
                    labelWidth={label ? 100 : 0}
                    options={options}
                    selected={value}
                    disabled={disabled}
                    onValueChange={handleSelect}
                />
            </View>
        );
    }

    // Inline-expanding list for >5 groups
    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.trigger} onPress={handleToggleExpand}>
                <Text style={styles.label}>{label ?? 'Group'}</Text>
                <Text style={styles.value}>{value}</Text>
                <Text style={styles.arrow}>{isExpanded ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {isExpanded && (
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
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 8,
        width: '100%',
    },
    input: {
        color: colors.text,
        fontSize: textSizes.normalText,
        borderBottomWidth: 1,
        borderBottomColor: colors.listSeparator,
        paddingVertical: 4,
        paddingHorizontal: 4,
        marginTop: 4,
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
});
