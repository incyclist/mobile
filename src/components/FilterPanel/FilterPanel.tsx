import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
} from 'react-native';
import { FilterPanelProps, SearchFilter } from './types';
import { colors, textSizes } from '../../theme';
import { useLogging } from '../../hooks';

/**
 * Internal Input component with numeric validation and blur-based update logic
 */
const FilterInput = ({ 
    value, placeholder, max, fieldName, onValueChange, compact, logEvent 
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
const FilterSelect = ({ 
    label, value, options, fieldName, onSelect, compact, logEvent, isHalf 
}: any) => {
    const [open, setOpen] = useState(false);
    const [triggerHeight, setTriggerHeight] = useState(0);
    const displayValue = value || 'All';

    const handleSelect = (item: string) => {
        const newValue = item === 'All' ? undefined : item;
        onSelect(newValue);
        setOpen(false);
        logEvent({ 
            message: 'option selected', 
            field: fieldName, 
            value: item, 
            eventSource: 'user' 
        });
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
                onPress={() => setOpen(!open)}
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
    } = options;

    const [localFilters, setLocalFilters] = useState<SearchFilter>(filters);
    const [localTitle, setLocalTitle] = useState(localFilters.title ?? '');

    const { logEvent } = useLogging('FilterPanel');

    useEffect(() => {
        setLocalFilters(filters);
    }, [filters]);

    useEffect(() => {
        setLocalTitle(localFilters.title ?? '');
    }, [localFilters.title]);

    const getActiveCount = (f: SearchFilter) => {
        let count = 0;
        if (f.title) count++;
        if (f.distance?.min !== undefined || f.distance?.max !== undefined) count++;
        if (f.elevation?.min !== undefined || f.elevation?.max !== undefined) count++;
        if (f.country) count++;
        if (f.contentType) count++;
        if (f.routeType) count++;
        if (f.routeSource) count++;
        return count;
    };

    const handleToggle = () => {
        logEvent({ message: 'button clicked', button: 'filter-toggle', eventSource: 'user' });
        onToggle();
    };

    const applyFilter = (updated: SearchFilter) => {
        setLocalFilters(updated);
        onFilterChanged(updated);
    };

    const updateMinMax = (key: 'distance' | 'elevation', type: 'min' | 'max', val: number | undefined) => {
        const defaultUnit = key === 'distance' ? (maxDistance?.unit ?? 'km') : (maxElevation?.unit ?? 'm');
        const current = localFilters[key] || {};
        
        const updated = {
            ...current,
            [type]: val !== undefined ? { value: val, unit: current[type]?.unit || defaultUnit } : undefined
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
                    <Text style={styles.filterIcon}>⚙</Text>
                    <Text style={styles.toggleLabel}>Filters</Text>
                </View>
                {getActiveCount(localFilters) > 0 && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{getActiveCount(localFilters)} active</Text>
                    </View>
                )}
            </TouchableOpacity>

            {visible && (
                <View style={[styles.panel, compact ? styles.gridColumn : styles.gridTwoColumn]}>
                    <View style={styles.fullWidth}>
                        <Text style={styles.label}>Title</Text>
                        <TextInput
                            style={[styles.input, compact && styles.inputCompact]}
                            value={localTitle}
                            onChangeText={setLocalTitle}
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
                                <Text style={styles.groupLabel}>Dist ({maxDistance?.unit ?? 'km'})</Text>
                                <View style={styles.minMaxRow}>
                                    <FilterInput 
                                        compact={compact} max={maxDistance?.value} fieldName="distance_min"
                                        value={localFilters.distance?.min?.value} logEvent={logEvent}
                                        onValueChange={(v: any) => updateMinMax('distance', 'min', v)}
                                    />
                                    <Text style={styles.separator}>-</Text>
                                    <FilterInput 
                                        compact={compact} max={maxDistance?.value} fieldName="distance_max"
                                        value={localFilters.distance?.max?.value} logEvent={logEvent}
                                        onValueChange={(v: any) => updateMinMax('distance', 'max', v)}
                                    />
                                </View>
                            </View>
                            <View style={styles.minMaxGroup}>
                                <Text style={styles.groupLabel}>Elev ({maxElevation?.unit ?? 'm'})</Text>
                                <View style={styles.minMaxRow}>
                                    <FilterInput 
                                        compact={compact} max={maxElevation?.value} fieldName="elevation_min"
                                        value={localFilters.elevation?.min?.value} logEvent={logEvent}
                                        onValueChange={(v: any) => updateMinMax('elevation', 'min', v)}
                                    />
                                    <Text style={styles.separator}>-</Text>
                                    <FilterInput 
                                        compact={compact} max={maxElevation?.value} fieldName="elevation_max"
                                        value={localFilters.elevation?.max?.value} logEvent={logEvent}
                                        onValueChange={(v: any) => updateMinMax('elevation', 'max', v)}
                                    />
                                </View>
                            </View>
                        </View>
                    </View>

                    <View style={[styles.twoColumnGrid, compact && styles.twoColumnGridCompact]}>
                        <FilterSelect 
                            label="Country" value={localFilters.country} options={countries} 
                            fieldName="country" compact={compact} logEvent={logEvent} isHalf={!compact}
                            onSelect={(v: any) => applyFilter({ ...localFilters, country: v })}
                        />
                        <FilterSelect 
                            label="Content" value={localFilters.contentType} options={contentTypes} 
                            fieldName="contentType" compact={compact} logEvent={logEvent} isHalf={!compact}
                            onSelect={(v: any) => applyFilter({ ...localFilters, contentType: v })}
                        />
                        <FilterSelect 
                            label="Type" value={localFilters.routeType} options={routeTypes} 
                            fieldName="routeType" compact={compact} logEvent={logEvent} isHalf={!compact}
                            onSelect={(v: any) => applyFilter({ ...localFilters, routeType: v })}
                        />
                        <FilterSelect 
                            label="Source" value={localFilters.routeSource} options={routeSources} 
                            fieldName="routeSource" compact={compact} logEvent={logEvent} isHalf={!compact}
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
    filterIcon: { color: colors.text, fontSize: 18 },
    toggleLabel: { color: colors.text, fontSize: textSizes.normalText, fontWeight: '700' },
    badge: { backgroundColor: colors.buttonPrimary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
    badgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
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
