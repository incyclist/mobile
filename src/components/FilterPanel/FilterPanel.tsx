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
import { colors } from '../../theme';
import { useLogging } from '../../hooks';
import { Icon } from '../Icon';
import { FormattedNumber } from 'incyclist-services'; // Added FormattedNumber import

const isFormattedNumber = (v: unknown): v is FormattedNumber =>
    typeof v === 'object' && v !== null && 'value' in v;

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
 * Internal Input component with numeric validation and blur-based update logic
 */
const FilterInput = ({ 
    value, placeholder, max, fieldName, onValueChange, compact, logEvent, onFocus 
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
            const val = parseFloat(cleaned);
            setError(isNaN(val) || val < 0 || (max !== undefined && val > max));
        } else {
            setError(false);
        }
    };

    const handleBlur = () => {
        const cleaned = localValue.replace(/[^0-9.]/g, '');
        if (cleaned === '') {
            onValueChange(undefined);
        } else {
            const val = parseFloat(cleaned);
            if (!isNaN(val) && val >= 0 && (max === undefined || val <= max)) {
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
            <TextInput
                style={[
                    styles.input, 
                    compact && styles.inputCompact, 
                    error && styles.inputError
                ]}
                value={localValue}
                onChangeText={handleChange}
                onBlur={handleBlur}
                onFocus={onFocus}
                placeholder={placeholder}
                placeholderTextColor={colors.disabled}
                keyboardType="numeric"
            />
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
                    <View style={styles.listCompact}>
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
                    </View>
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

export const FilterPanel = (props: FilterPanelProps) => {
    const { filters, visible, compact, onFilterChanged, onToggle, options } = props;
    const { height: screenHeight } = useWindowDimensions();
    const compactMaxHeight = compact ? screenHeight * 0.6 : undefined;
    // Bounds the non-compact dropdown overlay so long option lists (e.g. 20+
    // countries) scroll within themselves instead of running off-screen.
    const dropdownMaxHeight = screenHeight * 0.4;
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

    const panelContent = (
        <>
            <View style={styles.fullWidth}>
                <Text style={styles.label}>Title</Text>
                <TextInput
                    style={[styles.input, compact && styles.inputCompact]}
                    value={localTitle}
                    onChangeText={setLocalTitle}
                    onFocus={closeDropdown}
                    onBlur={() => applyFilter({
                        ...localFilters,
                        title: localTitle === '' ? undefined : localTitle
                    })}
                    placeholder="Search title..."
                    placeholderTextColor={colors.disabled}
                />
            </View>

            <View style={styles.fullWidth}>
                <View style={styles.row}>
                    <View style={styles.minMaxGroup}>
                        <Text style={styles.groupLabel}>Dist ({ (isFormattedNumber(maxDistance) ? maxDistance.unit : 'km') ?? 'km'})</Text> {/* Applied type guard */}
                        <View style={styles.minMaxRow}>
                            <FilterInput 
                                compact={compact} max={isFormattedNumber(maxDistance) ? maxDistance.value : maxDistance} fieldName="distance_min" // Applied type guard
                                value={isFormattedNumber(localFilters?.distance?.min) ? localFilters.distance!.min!.value : localFilters?.distance?.min} logEvent={logEvent}
                                onValueChange={(v: any) => updateMinMax('distance', 'min', v)}
                                onFocus={closeDropdown}
                            />
                            <Text style={styles.separator}>-</Text>
                            <FilterInput 
                                compact={compact} max={isFormattedNumber(maxDistance) ? maxDistance.value : maxDistance} fieldName="distance_max" // Applied type guard
                                value={isFormattedNumber(localFilters?.distance?.max) ? localFilters.distance!.max!.value : localFilters?.distance?.max} logEvent={logEvent}
                                onValueChange={(v: any) => updateMinMax('distance', 'max', v)}
                                onFocus={closeDropdown}
                            />
                        </View>
                    </View>
                    <View style={styles.minMaxGroup}>
                        <Text style={styles.groupLabel}>Elev ({ (isFormattedNumber(maxElevation) ? maxElevation.unit : 'm') ?? 'm'})</Text> {/* Applied type guard */}
                        <View style={styles.minMaxRow}>
                            <FilterInput 
                                compact={compact} max={isFormattedNumber(maxElevation) ? maxElevation.value : maxElevation} fieldName="elevation_min" // Applied type guard
                                value={isFormattedNumber(localFilters?.elevation?.min) ? localFilters.elevation!.min!.value : localFilters?.elevation?.min} logEvent={logEvent}
                                onValueChange={(v: any) => updateMinMax('elevation', 'min', v)}
                                onFocus={closeDropdown}
                            />
                            <Text style={styles.separator}>-</Text>
                            <FilterInput 
                                compact={compact} max={isFormattedNumber(maxElevation) ? maxElevation.value : maxElevation} fieldName="elevation_max" // Applied type guard
                                value={isFormattedNumber(localFilters?.elevation?.max) ? localFilters.elevation!.max!.value : localFilters?.elevation?.max} logEvent={logEvent}
                                onValueChange={(v: any) => updateMinMax('elevation', 'max', v)}
                                onFocus={closeDropdown}
                            />
                        </View>
                    </View>
                </View>
            </View>

            <View style={[styles.twoColumnGrid, compact && styles.twoColumnGridCompact]}>
                <FilterSelect
                    label="Country" value={localFilters.country} options={countries}
                    fieldName="country" compact={compact} logEvent={logEvent} isHalf={!compact}
                    isOpen={openField === 'country'} onOpen={setOpenField} maxHeight={dropdownMaxHeight}
                    onSelect={(v: any) => applyFilter({ ...localFilters, country: v })}
                />
                <FilterSelect
                    label="Content" value={localFilters.contentType} options={contentTypes}
                    fieldName="contentType" compact={compact} logEvent={logEvent} isHalf={!compact}
                    isOpen={openField === 'contentType'} onOpen={setOpenField} maxHeight={dropdownMaxHeight}
                    onSelect={(v: any) => applyFilter({ ...localFilters, contentType: v })}
                />
                <FilterSelect
                    label="Type" value={localFilters.routeType} options={routeTypes}
                    fieldName="routeType" compact={compact} logEvent={logEvent} isHalf={!compact}
                    isOpen={openField === 'routeType'} onOpen={setOpenField} maxHeight={dropdownMaxHeight}
                    onSelect={(v: any) => applyFilter({ ...localFilters, routeType: v })}
                />
                <FilterSelect
                    label="Source" value={localFilters.routeSource} options={routeSources}
                    fieldName="routeSource" compact={compact} logEvent={logEvent} isHalf={!compact}
                    isOpen={openField === 'routeSource'} onOpen={setOpenField} maxHeight={dropdownMaxHeight}
                    onSelect={(v: any) => applyFilter({ ...localFilters, routeSource: v })}
                />
            </View>
        </>
    );

    return (
        <View style={[
            styles.container,
            compact && styles.containerCompact,
            compact && compactMaxHeight !== undefined && { maxHeight: compactMaxHeight },
        ]}>
            <TouchableOpacity style={styles.toggleRow} onPress={handleToggle} activeOpacity={0.8}>
                <View style={styles.toggleLeft}>
                    <Icon
                        name={visible ? 'chevron-up' : 'funnel'}
                        size={20}
                        color={colors.text}
                    />
                </View>
                <View style={styles.pillsRow}>
                    {getFilterPills(localFilters).map((pill, i) => (
                        <View key={i} style={styles.pill}>
                            <Text style={styles.pillText}>{pill}</Text>
                        </View>
                    ))}
                </View>
            </TouchableOpacity>

            {visible && (
                compact ? (
                    <ScrollView
                        style={[styles.panel, styles.panelCompact]}
                        contentContainerStyle={styles.gridColumn}
                        keyboardShouldPersistTaps="handled"
                    >
                        {panelContent}
                    </ScrollView>
                ) : (
                    <View style={[styles.panel, styles.gridTwoColumn]}>
                        {panelContent}
                    </View>
                )
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
    // Compact mode bounds the panel to compactMaxHeight and must clip at that
    // box — otherwise the inline-expanding FilterSelect list (and the panel
    // ScrollView, which has no bounded height of its own) paints straight past
    // the container into the sibling RouteList below, and swipes meant for
    // the dropdown land on the RouteList's ScrollView instead.
    containerCompact: {
        overflow: 'hidden',
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
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
    // flex: 1 gives the ScrollView an actual bounded viewport within
    // containerCompact's maxHeight, so it — not the sibling RouteList below —
    // captures swipes and scrolls internally once content overflows.
    panelCompact: { flex: 1 },
    gridTwoColumn: { flexDirection: 'row', flexWrap: 'wrap' },
    gridColumn: { flexDirection: 'column' },
    fullWidth: { width: '100%', marginBottom: 8 },
    twoColumnGrid: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    twoColumnGridCompact: { flexDirection: 'column' },
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
    inputCompact: { height: 28, fontSize: 12, paddingHorizontal: 4 },
    inputError: { borderColor: colors.error },
    errorText: { color: colors.error, fontSize: 9, marginTop: 1 },
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
    selectTriggerCompact: { height: 28 },
    selectTriggerCompactInline: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderWidth: 1,
        borderColor: '#555',
        borderRadius: 4,
        paddingHorizontal: 8,
        height: 28,
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
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    optionTextCompact: {
        color: '#FFF',
        fontSize: 13,
    },
    optionSelectedCompact: {
        color: colors.buttonPrimary,
        fontWeight: 'bold',
    },
});