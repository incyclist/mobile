import React, { useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import type { RouteDisplayItem } from 'incyclist-services';
import { colors, textSizes } from '../../../theme';
import { Icon } from '../../Icon';
import { useLogging } from '../../../hooks';

interface ParseSelectionViewProps {
    compact: boolean;
    routes: RouteDisplayItem[];
    parseProgress?: { parsed: number; total: number };
    selectedIds: string[];
    onToggle: (id: string) => void;
    onSelectAll: () => void;
    onDeselectAll: () => void;
}

const Checkbox = ({ checked, disabled, onToggle }: { checked: boolean; disabled?: boolean; onToggle: () => void }) => {
    const boxStyle = [
        styles.checkbox,
        checked && styles.checkboxChecked,
        disabled && styles.checkboxDisabled
    ];
    
    return (
        <TouchableOpacity 
            onPress={onToggle} 
            disabled={disabled} 
            style={boxStyle}
            activeOpacity={0.7}
        >
            {checked && <View style={styles.checkmark} />}
        </TouchableOpacity>
    );
};

const WarningIndicator = () => (
    <View style={styles.warningIndicator}>
        <Text style={styles.warningChar}>!</Text>
    </View>
);

const friendlyError = (error: string): string => {
    const lower = error.toLowerCase();
    if (lower.includes('could not open file') || lower.includes('could not read')) {
        return 'Could not read file';
    }
    if (lower.includes('could not parse')) {
        return 'Invalid file format';
    }
    return 'Import not supported';
};

const RouteRow = ({ 
    item, 
    isSelected, 
    onToggle, 
    compact 
}: { 
    item: RouteDisplayItem; 
    isSelected: boolean; 
    onToggle: (id: string) => void;
    compact: boolean;
}) => {
    const { logEvent } = useLogging('ParseSelectionView');
    const handleToggle = useCallback(() => {
        logEvent({
            message: isSelected ? 'option deselected' : 'option selected',
            field: 'route',
            value: item.label,
            eventSource: 'user'
        });
        onToggle(item.id);
    }, [isSelected, item.label, item.id, onToggle, logEvent]);

    const isImportable = item.importable !== false;
    const rowStyle = [styles.row, !isImportable && styles.rowDisabled];
    const labelStyle = [styles.label, compact && styles.labelCompact];

    return (
        <View style={rowStyle}>
            <Checkbox 
                checked={isSelected} 
                disabled={!isImportable} 
                onToggle={handleToggle} 
            />
            <View style={styles.rowContent}>
                <Text style={labelStyle} numberOfLines={1}>
                    {item.label}
                </Text>
                <View style={styles.details}>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{item.format.toUpperCase()}</Text>
                    </View>
                    {item.distance !== undefined && (
                        <View style={styles.distance}>
                            <Icon name='distance' size={14} color={colors.text} />
                            <Text style={styles.distanceText}>
                                {item.distance.value} {item.distance.unit}
                            </Text>
                        </View>
                    )}
                </View>
                {!isImportable && item.errorReason && (
                    <Text style={styles.errorText}>{friendlyError(item.errorReason)}</Text>
                )}
            </View>
            {!isImportable && <WarningIndicator />}
        </View>
    );
};

export const ParseSelectionView = ({
    compact,
    routes,
    parseProgress,
    selectedIds,
    onToggle,
    onSelectAll,
    onDeselectAll,
}: ParseSelectionViewProps) => {
    const { logEvent } = useLogging('ParseSelectionView');
    const isParsing = !!parseProgress;

    const handleSelectAll = useCallback(() => {
        logEvent({ message: 'button clicked', button: 'select-all', eventSource: 'user' });
        onSelectAll();
    }, [logEvent, onSelectAll]);

    const handleDeselectAll = useCallback(() => {
        logEvent({ message: 'button clicked', button: 'deselect-all', eventSource: 'user' });
        onDeselectAll();
    }, [logEvent, onDeselectAll]);
    
    const renderItem = useCallback(({ item: routeItem }: { item: RouteDisplayItem }) => (
        <RouteRow 
            item={routeItem} 
            isSelected={selectedIds.includes(routeItem.id)} 
            onToggle={onToggle}
            compact={compact}
        />
    ), [selectedIds, onToggle, compact]);

    const containerStyle = [styles.container, compact && styles.containerCompact];

    return (
        <View style={containerStyle}>
            <View style={styles.header}>
                {isParsing ? (
                    <Text style={styles.title}>
                        Found {parseProgress.total} files... Parsing: {parseProgress.parsed}/{parseProgress.total}
                    </Text>
                ) : (
                    <Text style={styles.title}>Select routes to import</Text>
                )}
            </View>

            <View style={styles.bulkActions}>
                <TouchableOpacity onPress={handleSelectAll} style={styles.bulkButton}>
                    <Text style={styles.bulkText}>Select All</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleDeselectAll} style={styles.bulkButton}>
                    <Text style={styles.bulkText}>Deselect All</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={routes}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                style={styles.list}
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        minHeight: 400,
    },
    containerCompact: {
        minHeight: 300,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 16,
    },
    title: {
        fontSize: textSizes.normalText,
        color: colors.text,
        fontWeight: 'bold',
    },
    bulkActions: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: 16,
    },
    bulkButton: {
        paddingVertical: 4,
    },
    bulkText: {
        color: colors.buttonPrimary,
        fontSize: textSizes.smallText,
        fontWeight: 'bold',
    },
    list: {
        flex: 1,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.listSeparator,
    },
    rowDisabled: {
        opacity: 0.7,
    },
    rowContent: {
        flex: 1,
    },
    label: {
        fontSize: textSizes.listEntry,
        color: colors.text,
        fontWeight: '500',
    },
    labelCompact: {
        fontSize: textSizes.normalText,
    },
    details: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    badge: {
        backgroundColor: colors.listItemBackground,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginRight: 10,
        borderWidth: 1,
        borderColor: colors.tileIdle,
    },
    badgeText: {
        fontSize: textSizes.microText,
        color: colors.text,
        fontWeight: 'bold',
    },
    distance: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    distanceText: {
        fontSize: textSizes.smallText,
        color: colors.text,
        marginLeft: 4,
    },
    errorText: {
        fontSize: textSizes.tinyText,
        color: colors.error,
        marginTop: 4,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderWidth: 2,
        borderColor: colors.buttonPrimary,
        borderRadius: 4,
        marginRight: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: colors.buttonPrimary,
    },
    checkboxDisabled: {
        borderColor: colors.disabled,
        backgroundColor: 'transparent',
    },
    checkmark: {
        width: 10,
        height: 10,
        backgroundColor: colors.text,
        borderRadius: 2,
    },
    warningIndicator: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: colors.warning,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    warningChar: {
        color: colors.iconSelected,
        fontSize: textSizes.subtitle,
        fontWeight: 'bold',
    },
});