import React, { useCallback, useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import type { RouteServerItem, RouteServersSettingsDisplayProps } from 'incyclist-services';
import { colors, textSizes } from '../../theme';
import { Button } from '../ButtonBar/ButtonBar';
import { LinkButton } from '../LinkButton';

interface ServerListProps {
    compact: boolean;
    displayProps: RouteServersSettingsDisplayProps;
    onAddServer: () => void;
    onRemove: (key: string) => void;
}

// Same green and grey as the connection badges of the Apps dialog; amber for "could not be reached"
const getDotColor = (status: RouteServerItem['status']): string => {
    switch (status) {
        case 'ok':
            return colors.success;
        case 'unreachable':
            return colors.statusDot.amber;
        default:
            return colors.disabled;
    }
};

const StatusDot = ({ status }: { status: RouteServerItem['status'] }) => {
    const opacity = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (status !== 'loading') {
            opacity.setValue(1);
            return;
        }
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [status, opacity]);

    const dotStyle = [styles.dot, { backgroundColor: getDotColor(status), opacity }];
    return <Animated.View style={dotStyle} />;
};

interface ServerRowProps {
    server: RouteServerItem;
    compact: boolean;
    onRemove: (key: string) => void;
}

const ServerRow = ({ server, compact, onRemove }: ServerRowProps) => {
    const handleRemove = useCallback(() => onRemove(server.key), [onRemove, server.key]);

    // the dot is only a colour: screen readers get the status as part of one combined label
    const label = `${server.name}, ${server.statusText}`;
    const statusStyle = [
        styles.status,
        compact && styles.statusCompact,
        server.status === 'unreachable' && styles.statusWarning,
    ];

    const secondLine = compact ? server.statusText : undefined;
    const meta = [server.host, server.tag].filter(Boolean).join('  ·  ');

    return (
        <View
            style={styles.row}
            accessible
            accessibilityLabel={label}
        >
            <StatusDot status={server.status} />
            <View style={styles.rowText}>
                <Text style={styles.name}>{server.name}</Text>
                {meta.length > 0 && <Text style={styles.host}>{meta}</Text>}
                {server.note && <Text style={styles.host}>{server.note}</Text>}
                {secondLine && <Text style={statusStyle}>{secondLine}</Text>}
            </View>
            {!compact && <Text style={statusStyle}>{server.statusText}</Text>}
            {server.canRemove && <LinkButton label="Remove" onPress={handleRemove} />}
        </View>
    );
};

export const ServerList = ({ compact, displayProps, onAddServer, onRemove }: ServerListProps) => {
    const { servers, isEmpty, emptyState } = displayProps;

    return (
        <View>
            {servers.map(server => (
                <ServerRow
                    key={server.key}
                    server={server}
                    compact={compact}
                    onRemove={onRemove}
                />
            ))}
            {isEmpty && emptyState && (
                <View style={styles.empty}>
                    <Text style={styles.emptyTitle}>{emptyState.title}</Text>
                    <Text style={styles.emptyText}>{emptyState.text}</Text>
                    <View style={styles.emptyButton}>
                        <Button label="Add route server" primary onClick={onAddServer} />
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 56,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.listSeparator,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 12,
    },
    rowText: {
        flex: 1,
        marginRight: 12,
    },
    name: {
        color: colors.text,
        fontSize: textSizes.listEntry,
        fontWeight: '500',
    },
    host: {
        color: colors.disabled,
        fontSize: textSizes.smallText,
    },
    status: {
        color: colors.text,
        fontSize: textSizes.normalText,
        marginRight: 12,
        textAlign: 'right',
    },
    statusCompact: {
        marginRight: 0,
        textAlign: 'left',
        fontSize: textSizes.smallText,
    },
    statusWarning: {
        color: colors.statusDot.amber,
    },
    empty: {
        alignItems: 'center',
        paddingVertical: 24,
        paddingHorizontal: 24,
    },
    emptyTitle: {
        color: colors.text,
        fontSize: textSizes.listEntry,
        fontWeight: '700',
        textAlign: 'center',
    },
    emptyText: {
        color: colors.text,
        fontSize: textSizes.normalText,
        textAlign: 'center',
        marginTop: 8,
        maxWidth: 520,
    },
    emptyButton: {
        marginTop: 12,
    },
});
