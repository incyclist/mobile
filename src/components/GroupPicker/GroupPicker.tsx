import React, { useCallback, useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { textSizes } from '../../theme/textSizes';
import { useLogging } from '../../hooks';
import { ChipSelect } from '../ChipSelect';
import { SingleSelect } from '../SingleSelect';
import { GroupPickerProps } from './types';

// Same threshold `RouteDetailsView` uses for its segment picker
// (SEGMENT_CHIP_THRESHOLD) — ChipSelect's chip row never wraps
// (`ChipSelect.tsx`'s `flexWrap: 'nowrap'`), so past this many options chips
// start overflowing off-screen and a SingleSelect dropdown reads better.
const GROUP_CHIP_THRESHOLD = 5;

// Rendered as a literal trailing option in ChipSelect/SingleSelect, not a
// separate button — sits inline with the real groups instead of floating
// off to the side, and every tap (including this one) goes through
// ChipSelect's/SingleSelect's own `logEvent('option selected', ...)` for free.
const NEW_GROUP_OPTION = '+ New';

/**
 * Shared group-selection UI (workout-mobile-hld.md §3.1): pick an existing
 * group — via `ChipSelect` (few groups) or `SingleSelect` (many, mirrors
 * `RouteDetailsView`'s segment picker) — or pick "+ New" to free-type one.
 * Used by both `WorkoutImportDialog` and `WorkoutDetailsDialog` (sessions
 * 5.2/5.3) — this session only exercises it standalone in Storybook with mock
 * group lists.
 */
export const GroupPicker = (props: GroupPickerProps) => {
    const { label, groups, value, disabled = false, allowNew = true, onValueChange } = props;
    const [isEditing, setIsEditing] = useState(false);
    const [newGroup, setNewGroup] = useState('');
    const { logEvent } = useLogging('GroupPicker');

    // The current value is always offered as an option, even when it isn't
    // (yet) one of the known groups — e.g. a just-typed new name before it's persisted.
    const known = groups.includes(value) || !value ? groups : [...groups, value];
    const options = allowNew ? [...known, NEW_GROUP_OPTION] : known;
    const useChips = known.length <= GROUP_CHIP_THRESHOLD;

    // No manual logEvent here — ChipSelect/SingleSelect already log
    // 'option selected' for every tap, including NEW_GROUP_OPTION.
    const handleSelect = useCallback(
        (group: string) => {
            if (group === NEW_GROUP_OPTION) {
                setNewGroup('');
                setIsEditing(true);
                return;
            }
            onValueChange(group);
        },
        [onValueChange]
    );

    const handleCommitNew = useCallback(() => {
        const trimmed = newGroup.trim();
        setIsEditing(false);
        if (!trimmed || trimmed === value) return;
        logEvent({ message: 'group entered', field: label ?? 'Group', value: trimmed, eventSource: 'user' });
        onValueChange(trimmed);
    }, [newGroup, value, label, logEvent, onValueChange]);

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

    return (
        <View style={styles.container}>
            {useChips ? (
                <ChipSelect
                    label={label ?? ''}
                    labelWidth={label ? 100 : 0}
                    options={options}
                    selected={value}
                    disabled={disabled}
                    onValueChange={handleSelect}
                />
            ) : (
                <SingleSelect
                    label={label ?? 'Group'}
                    options={options}
                    selected={value}
                    disabled={disabled}
                    onValueChange={handleSelect}
                />
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
});
