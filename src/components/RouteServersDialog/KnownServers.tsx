import React, { useCallback } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import type { KnownServerItem } from 'incyclist-services';
import { colors, textSizes } from '../../theme';
import { Button } from '../ButtonBar/ButtonBar';

interface KnownRowProps {
    item: KnownServerItem;
    onAdd: (id: string) => void;
    onRetry: (id: string) => void;
}

const KnownStatus = ({ item, onAdd, onRetry }: KnownRowProps) => {
    const handleAdd = useCallback(() => onAdd(item.id), [onAdd, item.id]);
    const handleRetry = useCallback(() => onRetry(item.id), [onRetry, item.id]);

    switch (item.state) {
        case 'checking':
            return (
                <View style={styles.statusRow}>
                    <ActivityIndicator size="small" color={colors.text} />
                    <Text style={styles.statusText}>Checking…</Text>
                </View>
            );
        case 'added': {
            const count = item.routeCount;
            const suffix = count === undefined ? '' : ` · ${count} ${count === 1 ? 'route' : 'routes'}`;
            return <Text style={styles.addedText}>{`Added ✓${suffix}`}</Text>;
        }
        case 'error':
            return <Button label="Try again" onClick={handleRetry} />;
        default:
            return <Button label="Add" primary onClick={handleAdd} />;
    }
};

const KnownRow = ({ item, onAdd, onRetry }: KnownRowProps) => {
    const by = item.operator ? ` · by ${item.operator}` : '';
    return (
        <View style={styles.row}>
            <View style={styles.rowText}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.desc}>{`${item.description}${by}`}</Text>
                {item.state === 'error' && item.error && <Text style={styles.error}>{item.error}</Text>}
            </View>
            <KnownStatus item={item} onAdd={onAdd} onRetry={onRetry} />
        </View>
    );
};

interface KnownServersProps {
    known: KnownServerItem[];
    knownNote?: string;
    onAdd: (id: string) => void;
    onRetry: (id: string) => void;
}

export const KnownServers = ({ known, knownNote, onAdd, onRetry }: KnownServersProps) => (
    <View>
        {known.map(item => (
            <KnownRow key={item.id} item={item} onAdd={onAdd} onRetry={onRetry} />
        ))}
        {knownNote && <Text style={styles.note}>{knownNote}</Text>}
    </View>
);

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 56,
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.listSeparator,
    },
    rowText: {
        flex: 1,
        marginRight: 8,
    },
    name: {
        color: colors.text,
        fontSize: textSizes.listEntry,
        fontWeight: '500',
    },
    desc: {
        color: colors.disabled,
        fontSize: textSizes.smallText,
    },
    error: {
        color: colors.warning,
        fontSize: textSizes.smallText,
        marginTop: 2,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 8,
    },
    statusText: {
        color: colors.text,
        fontSize: textSizes.normalText,
        marginLeft: 8,
    },
    addedText: {
        color: colors.success,
        fontSize: textSizes.normalText,
        fontWeight: '600',
        marginHorizontal: 8,
    },
    note: {
        color: colors.disabled,
        fontSize: textSizes.smallText,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
});
