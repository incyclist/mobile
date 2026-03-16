import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
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
        return []
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
 * Internal Select component with inline dropdown list
 */
const FilterSelect = (props: any) => {
    const { 
        label, value, options, fieldName, onSelect, compact, 
        logEvent, isHalf, isOpen: open, onOpen 
    } = props;
    
    const [triggerHeight, setTriggerHeight] = useState(0);
    const displayValue = value || 'All';

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

    return (
        <View style={[
            styles.fieldContainer, 
            isHalf && styles.fieldContainerHalf,
            open && styles.fieldContainerOpen
        ]}>
            <Text style={styles.label}>{label}</Text>
            <TouchableOpacity 
                style={[styles.selectTrigger, compact && styles.selectTriggerCompact]} 
                onPress={() => onOpen(open ? null : fieldName)}
                onLayout={(e) => setTriggerHeight(e.nativeEvent.layout.height)}
            >
                <Text style={styles.selectText}>{displayValue}</Text>
                <Text style={styles.dropdownArrow}>{open ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {open && (
                <View style={[styles.dropdownList, { top: triggerHeight + 2 }]}>
                    {['All', ...options].map((item: string) => (
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
                </View>
            )}
        </View>
    );
};

export const FilterPanel = (props: FilterPanelProps) => {
    const { filters, visible, compact, onFilterChanged, onToggle, options } = props;
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
        
        const unit = typeof current[type]==='number' ? defaultUnit : current[type]?.unit || defaultUnit
        const updated = {
            ...current,
            [type]: val !== undefined ? { value: val, unit } : undefined
        };

        applyFilter({
            ...localFilters,
            [key]: (updated.min || updated.max) ? updated : undefined
        });
    };

    return (
        <View style={styles.container}>
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
                <View style={[styles.panel, compact ? styles.gridColumn : styles.gridTwoColumn]}>
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
                            isOpen={openField === 'country'} onOpen={setOpenField}
                            onSelect={(v: any) => applyFilter({ ...localFilters, country: v })}
                        />
                        <FilterSelect 
                            label="Content" value={localFilters.contentType} options={contentTypes} 
                            fieldName="contentType" compact={compact} logEvent={logEvent} isHalf={!compact}
                            isOpen={openField === 'contentType'} onOpen={setOpenField}
                            onSelect={(v: any) => applyFilter({ ...localFilters, contentType: v })}
                        />
                        <FilterSelect 
                            label="Type" value={localFilters.routeType} options={routeTypes} 
                            fieldName="routeType" compact={compact} logEvent={logEvent} isHalf={!compact}
                            isOpen={openField === 'routeType'} onOpen={setOpenField}
                            onSelect={(v: any) => applyFilter({ ...localFilters, routeType: v })}
                        />
                        <FilterSelect 
                            label="Source" value={localFilters.routeSource} options={routeSources} 
                            fieldName="routeSource" compact={compact} logEvent={logEvent} isHalf={!compact}
                            isOpen={openField === 'routeSource'} onOpen={setOpenField}
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
    gridColumn: { flexDirection: 'column' },
    fullWidth: { width: '100%', marginBottom: 8 },
    twoColumnGrid: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    twoColumnGridCompact: { flexDirection: 'column' },
    fieldContainer: { marginBottom: 8, width: '100%' },
    fieldContainerHalf: { width: '48%' },
    fieldContainerOpen: { zIndex: 10 },
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
    selectText: { color: '#FFF', fontSize: 13 },
    dropdownArrow: { color: colors.disabled, fontSize: 10 },
    dropdownList: {
        position: 'absolute',
        left: 0,
        right: 0,
        backgroundColor: '#333',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#555',
        zIndex: 999,
    },
    optionItem: { paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#444' },
    optionText: { color: '#FFF', fontSize: 14, textAlign: 'center' },
    optionSelected: { color: colors.buttonPrimary, fontWeight: 'bold' },
});