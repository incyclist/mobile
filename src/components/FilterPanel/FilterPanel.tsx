import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
    TextInput,
    useWindowDimensions,
    ScrollView,
    Modal,
} from 'react-native';
import { FilterPanelProps, SearchFilter } from './types';
import { ButtonProps } from '../ButtonBar/types';
import { Dialog } from '../Dialog';
import { ChipSelect } from '../ChipSelect';
import { colors } from '../../theme';
import { useLogging } from '../../hooks';
import { Icon } from '../Icon';
import { isFormattedNumber } from '../../utils/formattedNumber';

/**
 * Helper to generate descriptive text for active filters
 */
const getFilterPills = (f: SearchFilter): string[] => {
    const pills: string[] = [];
    if (!f) {
        return [];
    }

    if (f.title) pills.push(`*${f.title}*`);
    if (f.contentType) pills.push(f.contentType);
    if (f.routeType) pills.push(f.routeType);
    if (f.routeSource) pills.push(f.routeSource);
    if (f.country) pills.push(f.country);
    if (f.distance?.min) pills.push(`dist:>${isFormattedNumber(f.distance.min) ? f.distance.min.value : f.distance.min}${isFormattedNumber(f.distance.min) ? f.distance.min.unit : ''}`);
    if (f.distance?.max) pills.push(`dist:<${isFormattedNumber(f.distance.max) ? f.distance.max.value : f.distance.max}${isFormattedNumber(f.distance.max) ? f.distance.max.unit : ''}`);
    if (f.elevation?.min) pills.push(`elev:>${isFormattedNumber(f.elevation.min) ? f.elevation.min.value : f.elevation.min}${isFormattedNumber(f.elevation.min) ? f.elevation.min.unit : ''}`);
    if (f.elevation?.max) pills.push(`elev:<${isFormattedNumber(f.elevation.max) ? f.elevation.max.value : f.elevation.max}${isFormattedNumber(f.elevation.max) ? f.elevation.max.unit : ''}`);
    return pills;
};

/**
 * Internal Input component with numeric validation. Commits its value on blur (works fine
 * whenever the platform actually delivers a blur event) and, when `showCommitButton` is set,
 * also via an explicit checkmark button and the keyboard's submit action - iOS's landscape
 * numeric keypad has no return key and blur is unreliable there, so the phone filter dialog
 * (the only caller that sets it) can't rely on blur alone.
 */
const FilterInput = ({
    value, placeholder, max, fieldName, onValueChange, large, showCommitButton, logEvent, onFocus
}: any) => {
    const [localValue, setLocalValue] = useState(value?.toString() ?? '');
    const [error, setError] = useState(false);

    useEffect(() => {
        setLocalValue(value?.toString() ?? '');
    }, [value]);

    const handleChange = (text: string) => {
        // Allow only digits and one decimal point
        const cleaned = text.replace(/[^0-9.]/g, '');
        setLocalValue(cleaned);
        if (cleaned !== '') {
            const val = Number.parseFloat(cleaned);
            setError(Number.isNaN(val) || val < 0 || (max !== undefined && val > max));
        } else {
            setError(false);
        }
    };

    const commit = () => {
        const cleaned = localValue.replace(/[^0-9.]/g, '');
        if (cleaned === '') {
            onValueChange(undefined);
        } else {
            const val = Number.parseFloat(cleaned);
            if (!Number.isNaN(val) && val >= 0 && (max === undefined || val <= max)) {
                onValueChange(val);
                logEvent({
                    message: 'text entered',
                    field: fieldName,
                    value: val,
                    eventSource: 'user'
                });
            }
        }
    };

    return (
        <View style={styles.flexInputWrapper}>
            <View style={styles.commitRow}>
                <TextInput
                    style={[
                        styles.input,
                        large && styles.inputLarge,
                        error && styles.inputError
                    ]}
                    value={localValue}
                    onChangeText={handleChange}
                    onBlur={commit}
                    onSubmitEditing={commit}
                    onFocus={onFocus}
                    placeholder={placeholder}
                    placeholderTextColor={colors.disabled}
                    keyboardType="numeric"
                />
                {showCommitButton && (
                    <TouchableOpacity
                        style={styles.commitButton}
                        onPress={commit}
                        accessibilityLabel={`Apply ${fieldName}`}
                    >
                        <Text style={styles.commitButtonText}>{'✓'}</Text>
                    </TouchableOpacity>
                )}
            </View>
            {error && <Text style={styles.errorText}>Max {max}</Text>}
        </View>
    );
};

/**
 * Internal Select component with inline dropdown list (compact mode) or a
 * `Modal` overlay (non-compact). Compact mode uses inline expansion to avoid
 * clipping by the ScrollView's overflow:'hidden'. The non-compact list used
 * to be a `position: 'absolute'` + `zIndex` overlay, but that only reorders
 * siblings sharing the same parent — it can't guarantee priority over a
 * completely separate sibling subtree (e.g. RoutesPage's route list, sitting
 * below FilterPanel in the same column). With 20+ options the list visually
 * overlapped that sibling, and swipes meant for the list were captured by
 * the sibling's own ScrollView instead. `Modal` owns its own native window
 * layer, so it reliably wins both paint order and touch priority regardless
 * of what else is on screen.
 *
 * Compact mode's own inline list (no nested Modal) is what the phone filter
 * dialog reuses for Country - nesting a Modal inside the dialog's own
 * full-screen Modal is fragile on iOS, and Country's option count is too
 * large for a chip row.
 */
const FilterSelect = (props: any) => {
    const {
        label, value, options, fieldName, onSelect, compact,
        logEvent, isHalf, isOpen: open, onOpen, maxHeight
    } = props;

    const displayValue = value || 'All';
    // `options` can be transiently undefined (e.g. filterOptions not loaded
    // yet right after navigating to the page). The non-compact list below
    // renders inside a Modal, whose children mount on every render
    // regardless of `visible` — so this must never crash even while closed.
    const safeOptions: string[] = options ?? [];

    // Declared unconditionally (Rules of Hooks) even though only the
    // non-compact branch below uses them — `compact` can change between
    // renders (e.g. tablet rotation/resize), and this component must call
    // the same hooks in the same order every render regardless of branch.
    const triggerRef = useRef<View>(null);
    const [triggerLayout, setTriggerLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });

    const handleSelect = (item: string) => {
        const newValue = item === 'All' ? undefined : item;

        logEvent({
            message: 'option selected',
            field: fieldName,
            value: item,
            eventSource: 'user'
        });

        onSelect(newValue);
        onOpen(null);
    };

    if (compact) {
        // Inline-expanding list for compact mode to avoid clipping by ScrollView
        return (
            <View style={[styles.fieldContainer, styles.fieldContainerCompact]}>
                <Text style={styles.label}>{label}</Text>
                <TouchableOpacity
                    style={styles.selectTriggerCompactInline}
                    onPress={() => onOpen(open ? null : fieldName)}
                >
                    <Text style={styles.selectText}>{displayValue}</Text>
                    <Text style={styles.dropdownArrow}>{open ? '▲' : '▼'}</Text>
                </TouchableOpacity>
                {open && (
                    <ScrollView style={[styles.listCompact, { maxHeight }]} keyboardShouldPersistTaps="handled">
                        {['All', ...safeOptions].map((item: string) => (
                            <TouchableOpacity
                                key={item}
                                style={styles.itemCompact}
                                onPress={() => handleSelect(item)}
                            >
                                <Text style={[
                                    styles.optionTextCompact,
                                    item === displayValue && styles.optionSelectedCompact
                                ]}>
                                    {item}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}
            </View>
        );
    }

    // Non-compact: trigger position is measured in window coordinates so the
    // Modal (which renders outside the normal view tree) can place its list
    // directly under the trigger.
    const handleOpen = () => {
        if (open) {
            onOpen(null);
            return;
        }
        triggerRef.current?.measureInWindow((x, y, width, height) => {
            setTriggerLayout({ x, y, width, height });
        });
        onOpen(fieldName);
    };

    return (
        <View style={[styles.fieldContainer, isHalf && styles.fieldContainerHalf]}>
            <Text style={styles.label}>{label}</Text>
            <TouchableOpacity
                ref={triggerRef}
                style={styles.selectTrigger}
                onPress={handleOpen}
            >
                <Text style={styles.selectText}>{displayValue}</Text>
                <Text style={styles.dropdownArrow}>{open ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            <Modal
                transparent
                visible={open}
                animationType="none"
                presentationStyle="overFullScreen"
                supportedOrientations={['landscape']}
                onRequestClose={() => onOpen(null)}
            >
                <TouchableWithoutFeedback onPress={() => onOpen(null)}>
                    <View style={styles.modalBackdrop}>
                        <TouchableWithoutFeedback>
                            <ScrollView
                                style={[
                                    styles.dropdownList,
                                    {
                                        top: triggerLayout.y + triggerLayout.height + 2,
                                        left: triggerLayout.x,
                                        width: triggerLayout.width,
                                        maxHeight,
                                    },
                                ]}
                                keyboardShouldPersistTaps="handled"
                            >
                                {['All', ...safeOptions].map((item: string) => (
                                    <TouchableOpacity
                                        key={item}
                                        style={styles.optionItem}
                                        onPress={() => handleSelect(item)}
                                    >
                                        <Text style={[
                                            styles.optionText,
                                            item === displayValue && styles.optionSelected
                                        ]}>
                                            {item}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
};

/** Single-select chip row with a leading "All" chip that clears the filter - used by the phone
 *  dialog for the small option sets (Content/Type/Source) in place of FilterSelect's Modal, which
 *  is fragile nested inside the dialog's own full-screen Modal on iOS. */
const FilterChips = ({ label, value, options, onSelect }: { label: string, value?: string, options?: string[], onSelect: (v: string | undefined) => void }) => (
    <View style={styles.dialogChipField}>
        <ChipSelect
            label={label}
            labelWidth={60}
            options={['All', ...(options ?? [])]}
            selected={value ?? 'All'}
            chipMinHeight={44}
            onValueChange={(v) => onSelect(v === 'All' ? undefined : v)}
        />
    </View>
);

export const FilterPanel = (props: FilterPanelProps) => {
    const { filters, visible, compact, onFilterChanged, onToggle, options, resultCount } = props;
    const { height: screenHeight } = useWindowDimensions();
    // Bounds the non-compact dropdown overlay so long option lists (e.g. 20+
    // countries) scroll within themselves instead of running off-screen.
    const dropdownMaxHeight = screenHeight * 0.4;
    // The phone dialog's Country list has the whole dialog body to scroll within, but still
    // needs its own bound - otherwise it pushes the footer ("Show N routes") off-screen instead
    // of scrolling internally.
    const dialogCountryMaxHeight = screenHeight * 0.5;
    const {
        countries,
        contentTypes,
        routeTypes,
        routeSources,
        maxDistance,
        maxElevation
    } = options??{};

    const [localFilters, setLocalFilters] = useState<SearchFilter|undefined>({});
    const [localTitle, setLocalTitle] = useState('');
    const [openField, setOpenField] = useState<string | null>(null);

    const { logEvent } = useLogging('FilterPanel');

    const closeDropdown = useCallback(() => setOpenField(null), []);

    useEffect(() => {
        if (localFilters)
            return;

        setLocalFilters(filters??{});
        setLocalTitle(filters?.title ?? '');
    }, [filters, localFilters]);

    if (!localFilters)
        return false;

    const handleToggle = () => {
        logEvent({ message: 'button clicked', button: 'filter-toggle', eventSource: 'user' });
        onToggle();
    };

    const applyFilter = (updated: SearchFilter) => {
        setLocalFilters(updated);
        onFilterChanged(updated);
    };

    const commitTitle = () => {
        applyFilter({
            ...localFilters,
            title: localTitle === '' ? undefined : localTitle
        });
    };

    const clearAll = () => {
        logEvent({ message: 'button clicked', button: 'filter-clear-all', eventSource: 'user' });
        setLocalTitle('');
        applyFilter({});
    };

    const updateMinMax = (key: 'distance' | 'elevation', type: 'min' | 'max', val: number | undefined) => {
        const defaultUnit = key === 'distance'
            ? (isFormattedNumber(maxDistance) ? maxDistance.unit : 'km') ?? 'km' // Applied type guard
            : (isFormattedNumber(maxElevation) ? maxElevation.unit : 'm') ?? 'm'; // Applied type guard
        const current = localFilters[key] || {};

        const unit = typeof current[type]==='number' ? defaultUnit : current[type]?.unit || defaultUnit;
        const updated = {
            ...current,
            [type]: val !== undefined ? { value: val, unit } : undefined
        };

        applyFilter({
            ...localFilters,
            [key]: (updated.min || updated.max) ? updated : undefined
        });
    };

    const activeFilterCount = getFilterPills(localFilters).length;

    const toggleRow = (
        <TouchableOpacity style={styles.toggleRow} onPress={handleToggle} activeOpacity={0.8}>
            <View style={styles.toggleLeft}>
                <Icon
                    name={!compact && visible ? 'chevron-up' : 'funnel'}
                    size={20}
                    color={colors.text}
                />
                {compact && activeFilterCount > 0 && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{activeFilterCount}</Text>
                    </View>
                )}
            </View>
            <View style={styles.pillsRow}>
                {getFilterPills(localFilters).map((pill, i) => (
                    <View key={i} style={styles.pill}>
                        <Text style={styles.pillText}>{pill}</Text>
                    </View>
                ))}
            </View>
        </TouchableOpacity>
    );

    if (compact) {
        const routeCount = resultCount ?? 0;
        const buttons: ButtonProps[] = [
            { id: 'filter-clear-all', label: 'Clear all', onClick: clearAll },
            { id: 'filter-show', label: `Show ${routeCount} route${routeCount === 1 ? '' : 's'}`, primary: true, onClick: handleToggle },
        ];

        return (
            <View style={styles.container}>
                {toggleRow}
                <Dialog
                    title="Filters"
                    variant="full"
                    visible={visible}
                    onOutsideClick={handleToggle}
                    buttons={buttons}
                >
                    <View style={styles.dialogRow}>
                        <View style={styles.dialogFieldFull}>
                            <Text style={styles.label}>Title</Text>
                            <View style={styles.commitRow}>
                                <TextInput
                                    style={[styles.input, styles.inputLarge]}
                                    value={localTitle}
                                    onChangeText={setLocalTitle}
                                    onBlur={commitTitle}
                                    onSubmitEditing={commitTitle}
                                    placeholder="Search title..."
                                    placeholderTextColor={colors.disabled}
                                />
                                <TouchableOpacity
                                    style={styles.commitButton}
                                    onPress={commitTitle}
                                    accessibilityLabel="Apply title filter"
                                >
                                    <Text style={styles.commitButtonText}>{'✓'}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    <View style={styles.dialogRow}>
                        <View style={styles.dialogFieldHalf}>
                            <Text style={styles.groupLabel}>Dist ({ (isFormattedNumber(maxDistance) ? maxDistance.unit : 'km') ?? 'km'})</Text>
                            <View style={styles.minMaxRow}>
                                <FilterInput
                                    large showCommitButton max={isFormattedNumber(maxDistance) ? maxDistance.value : maxDistance} fieldName="distance_min"
                                    value={isFormattedNumber(localFilters?.distance?.min) ? localFilters.distance!.min!.value : localFilters?.distance?.min} logEvent={logEvent}
                                    onValueChange={(v: any) => updateMinMax('distance', 'min', v)}
                                />
                                <Text style={styles.separator}>-</Text>
                                <FilterInput
                                    large showCommitButton max={isFormattedNumber(maxDistance) ? maxDistance.value : maxDistance} fieldName="distance_max"
                                    value={isFormattedNumber(localFilters?.distance?.max) ? localFilters.distance!.max!.value : localFilters?.distance?.max} logEvent={logEvent}
                                    onValueChange={(v: any) => updateMinMax('distance', 'max', v)}
                                />
                            </View>
                        </View>
                        <View style={styles.dialogFieldHalf}>
                            <Text style={styles.groupLabel}>Elev ({ (isFormattedNumber(maxElevation) ? maxElevation.unit : 'm') ?? 'm'})</Text>
                            <View style={styles.minMaxRow}>
                                <FilterInput
                                    large showCommitButton max={isFormattedNumber(maxElevation) ? maxElevation.value : maxElevation} fieldName="elevation_min"
                                    value={isFormattedNumber(localFilters?.elevation?.min) ? localFilters.elevation!.min!.value : localFilters?.elevation?.min} logEvent={logEvent}
                                    onValueChange={(v: any) => updateMinMax('elevation', 'min', v)}
                                />
                                <Text style={styles.separator}>-</Text>
                                <FilterInput
                                    large showCommitButton max={isFormattedNumber(maxElevation) ? maxElevation.value : maxElevation} fieldName="elevation_max"
                                    value={isFormattedNumber(localFilters?.elevation?.max) ? localFilters.elevation!.max!.value : localFilters?.elevation?.max} logEvent={logEvent}
                                    onValueChange={(v: any) => updateMinMax('elevation', 'max', v)}
                                />
                            </View>
                        </View>
                    </View>

                    <View style={styles.dialogRow}>
                        <FilterChips label="Content" value={localFilters.contentType} options={contentTypes} onSelect={(v) => applyFilter({ ...localFilters, contentType: v })} />
                        <FilterChips label="Type" value={localFilters.routeType} options={routeTypes} onSelect={(v) => applyFilter({ ...localFilters, routeType: v })} />
                        <FilterChips label="Source" value={localFilters.routeSource} options={routeSources} onSelect={(v) => applyFilter({ ...localFilters, routeSource: v })} />
                    </View>

                    <View style={styles.dialogRow}>
                        <FilterSelect
                            label="Country" value={localFilters.country} options={countries}
                            fieldName="country" compact logEvent={logEvent}
                            isOpen={openField === 'country'} onOpen={setOpenField} maxHeight={dialogCountryMaxHeight}
                            onSelect={(v: any) => applyFilter({ ...localFilters, country: v })}
                        />
                    </View>
                </Dialog>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {toggleRow}

            {visible && (
                <View style={[styles.panel, styles.gridTwoColumn]}>
                    <View style={styles.fullWidth}>
                        <Text style={styles.label}>Title</Text>
                        <TextInput
                            style={styles.input}
                            value={localTitle}
                            onChangeText={setLocalTitle}
                            onFocus={closeDropdown}
                            onBlur={commitTitle}
                            placeholder="Search title..."
                            placeholderTextColor={colors.disabled}
                        />
                    </View>

                    <View style={styles.fullWidth}>
                        <View style={styles.row}>
                            <View style={styles.minMaxGroup}>
                                <Text style={styles.groupLabel}>Dist ({ (isFormattedNumber(maxDistance) ? maxDistance.unit : 'km') ?? 'km'})</Text>
                                <View style={styles.minMaxRow}>
                                    <FilterInput
                                        max={isFormattedNumber(maxDistance) ? maxDistance.value : maxDistance} fieldName="distance_min"
                                        value={isFormattedNumber(localFilters?.distance?.min) ? localFilters.distance!.min!.value : localFilters?.distance?.min} logEvent={logEvent}
                                        onValueChange={(v: any) => updateMinMax('distance', 'min', v)}
                                        onFocus={closeDropdown}
                                    />
                                    <Text style={styles.separator}>-</Text>
                                    <FilterInput
                                        max={isFormattedNumber(maxDistance) ? maxDistance.value : maxDistance} fieldName="distance_max"
                                        value={isFormattedNumber(localFilters?.distance?.max) ? localFilters.distance!.max!.value : localFilters?.distance?.max} logEvent={logEvent}
                                        onValueChange={(v: any) => updateMinMax('distance', 'max', v)}
                                        onFocus={closeDropdown}
                                    />
                                </View>
                            </View>
                            <View style={styles.minMaxGroup}>
                                <Text style={styles.groupLabel}>Elev ({ (isFormattedNumber(maxElevation) ? maxElevation.unit : 'm') ?? 'm'})</Text>
                                <View style={styles.minMaxRow}>
                                    <FilterInput
                                        max={isFormattedNumber(maxElevation) ? maxElevation.value : maxElevation} fieldName="elevation_min"
                                        value={isFormattedNumber(localFilters?.elevation?.min) ? localFilters.elevation!.min!.value : localFilters?.elevation?.min} logEvent={logEvent}
                                        onValueChange={(v: any) => updateMinMax('elevation', 'min', v)}
                                        onFocus={closeDropdown}
                                    />
                                    <Text style={styles.separator}>-</Text>
                                    <FilterInput
                                        max={isFormattedNumber(maxElevation) ? maxElevation.value : maxElevation} fieldName="elevation_max"
                                        value={isFormattedNumber(localFilters?.elevation?.max) ? localFilters.elevation!.max!.value : localFilters?.elevation?.max} logEvent={logEvent}
                                        onValueChange={(v: any) => updateMinMax('elevation', 'max', v)}
                                        onFocus={closeDropdown}
                                    />
                                </View>
                            </View>
                        </View>
                    </View>

                    <View style={styles.twoColumnGrid}>
                        <FilterSelect
                            label="Country" value={localFilters.country} options={countries}
                            fieldName="country" logEvent={logEvent} isHalf
                            isOpen={openField === 'country'} onOpen={setOpenField} maxHeight={dropdownMaxHeight}
                            onSelect={(v: any) => applyFilter({ ...localFilters, country: v })}
                        />
                        <FilterSelect
                            label="Content" value={localFilters.contentType} options={contentTypes}
                            fieldName="contentType" logEvent={logEvent} isHalf
                            isOpen={openField === 'contentType'} onOpen={setOpenField} maxHeight={dropdownMaxHeight}
                            onSelect={(v: any) => applyFilter({ ...localFilters, contentType: v })}
                        />
                        <FilterSelect
                            label="Type" value={localFilters.routeType} options={routeTypes}
                            fieldName="routeType" logEvent={logEvent} isHalf
                            isOpen={openField === 'routeType'} onOpen={setOpenField} maxHeight={dropdownMaxHeight}
                            onSelect={(v: any) => applyFilter({ ...localFilters, routeType: v })}
                        />
                        <FilterSelect
                            label="Source" value={localFilters.routeSource} options={routeSources}
                            fieldName="routeSource" logEvent={logEvent} isHalf
                            isOpen={openField === 'routeSource'} onOpen={setOpenField} maxHeight={dropdownMaxHeight}
                            onSelect={(v: any) => applyFilter({ ...localFilters, routeSource: v })}
                        />
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: 8,
        overflow: 'visible',
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    badge: {
        position: 'absolute',
        top: -6,
        right: -8,
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        paddingHorizontal: 3,
        backgroundColor: colors.buttonPrimary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    pillsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
        flex: 1,
        justifyContent: 'flex-end',
    },
    pill: {
        backgroundColor: colors.buttonPrimary,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
    },
    pillText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    panel: { padding: 8 },
    gridTwoColumn: { flexDirection: 'row', flexWrap: 'wrap' },
    fullWidth: { width: '100%', marginBottom: 8 },
    twoColumnGrid: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    fieldContainer: { marginBottom: 8, width: '100%' },
    fieldContainerHalf: { width: '48%' },
    label: { color: colors.text, fontSize: 12, marginBottom: 2, opacity: 0.8 },
    input: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: '#555',
        borderRadius: 4,
        color: '#FFF',
        paddingHorizontal: 8,
        height: 36,
        fontSize: 14,
    },
    // Used only inside the phone filter dialog - 44pt minimum touch target, per the UX
    // consultation: compact mode's old 28px inputs had no reason to
    // stay shrunk once the panel became a full-screen dialog with room to spare.
    inputLarge: { height: 44, fontSize: 16, paddingHorizontal: 10 },
    inputError: { borderColor: colors.error },
    errorText: { color: colors.error, fontSize: 9, marginTop: 1 },
    // Wraps a text/numeric input together with its explicit commit button (dialog-only) - the
    // landscape numeric keyboard has no return key on iOS, so blur-to-commit alone can leave a
    // typed value stuck uncommitted.
    commitRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    commitButton: {
        width: 44,
        height: 44,
        borderRadius: 4,
        backgroundColor: colors.buttonPrimary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    commitButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
    row: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    minMaxGroup: { width: '49%' },
    groupLabel: { color: colors.text, fontSize: 11, marginBottom: 2, opacity: 0.7 },
    minMaxRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    flexInputWrapper: { flex: 1 },
    separator: { color: colors.disabled, fontSize: 12 },
    selectTrigger: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderWidth: 1,
        borderColor: '#555',
        borderRadius: 4,
        paddingHorizontal: 8,
        height: 36,
    },
    // Used only by the phone dialog's Country field (the sole remaining caller of FilterSelect's
    // `compact` inline-list branch) - sized for the 44pt touch-target minimum, per the same UX
    // consultation as inputLarge above.
    selectTriggerCompactInline: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderWidth: 1,
        borderColor: '#555',
        borderRadius: 4,
        paddingHorizontal: 10,
        height: 44,
    },
    selectText: { color: '#FFF', fontSize: 13 },
    dropdownArrow: { color: colors.disabled, fontSize: 10 },
    // Fills the Modal's own window; position/size of the actual list below
    // is set inline per-instance from the trigger's measured window coords.
    modalBackdrop: { flex: 1 },
    dropdownList: {
        position: 'absolute',
        backgroundColor: '#333',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#555',
    },
    optionItem: { paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#444' },
    optionText: { color: '#FFF', fontSize: 14, textAlign: 'center' },
    optionSelected: { color: colors.buttonPrimary, fontWeight: 'bold' },
    fieldContainerCompact: { width: '100%', marginBottom: 8 },
    listCompact: {
        backgroundColor: colors.listItemBackground,
        borderRadius: 8,
        marginTop: 4,
    },
    itemCompact: {
        paddingHorizontal: 14,
        paddingVertical: 14,
        minHeight: 44,
        justifyContent: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    optionTextCompact: {
        color: '#FFF',
        fontSize: 15,
    },
    optionSelectedCompact: {
        color: colors.buttonPrimary,
        fontWeight: 'bold',
    },
    // Phone filter dialog layout: 2-3 short columns, no vertical scrolling of its own (the
    // Dialog's own ScrollView handles overflow on the smallest supported viewport).
    dialogRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 12,
    },
    dialogFieldFull: { width: '100%' },
    dialogFieldHalf: { flexGrow: 1, flexBasis: '45%' },
    // Content/Type/Source render three-across (not two) so the phone dialog's fixed rows -
    // Title, Dist/Elev, Content/Type/Source, Country - all fit within the shortest supported
    // viewport (~430px tall) with no vertical scrolling, per the UX consultation.
    dialogChipField: { flexGrow: 1, flexBasis: '30%' },
});
