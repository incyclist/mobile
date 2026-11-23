import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, textSizes } from '../../theme';
import { useLogging } from '../../hooks';
import { Button } from '../ButtonBar/ButtonBar';
import { RouteSharingChecklist } from '../RouteSharingChecklist';
import type { RouteSharingPlatform, RouteSharingRow } from './types';
import { DotKind, formatWhen, getDotKind, getExpandedSummary, getSubLine } from './utils';

const dotColors: Record<DotKind, string> = {
    success: colors.success,
    successDim: 'rgba(76, 175, 80, 0.45)',
    disabled: colors.disabled,
    warning: colors.warning,
};

interface ComputerRowProps {
    row: RouteSharingRow;
    expanded: boolean;
    platform: RouteSharingPlatform;
    now: number;
    onToggle: (linkId: string) => void;
    onRename: (linkId: string) => void;
    onForget: (linkId: string) => void;
    onOpenIosSettings: () => void;
}

const Body = ({ row, platform, now, onRename, onForget, onOpenIosSettings }: Omit<ComputerRowProps, 'expanded' | 'onToggle'>) => {
    const handleRename = useCallback(() => onRename(row.linkId), [onRename, row.linkId]);
    const handleForget = useCallback(() => onForget(row.linkId), [onForget, row.linkId]);

    let content: React.ReactNode;
    if (row.reachability === 'reachable' || row.reachability === 'checking') {
        content = (
            <>
                <Text style={styles.text}>{getExpandedSummary(row)}</Text>
                {row.reachability === 'reachable' && row.sync === 'failed' && (
                    <Text style={styles.text}>{`Connected to ${row.name}, but the routes could not be loaded.`}</Text>
                )}
                {row.reachability === 'reachable' && row.sync === 'media-unavailable' && (
                    <Text style={styles.text}>This device cannot load routes from your computer yet.</Text>
                )}
                <Text style={styles.text}>{`Last connected: ${formatWhen(row.lastSeenAt, now)}`}</Text>
            </>
        );
    } else if (row.reachability === 'version-mismatch') {
        content = (
            <Text style={styles.text}>
                {`${row.name} is running a version of Incyclist that can't share routes with this app. Update Incyclist on ${row.name}.`}
            </Text>
        );
    } else {
        const iosHint = platform === 'ios' && row.reachability === 'never-reached';
        content = (
            <RouteSharingChecklist
                variant="reach"
                name={row.name}
                showLocalNetworkHint={iosHint}
                onOpenSettings={onOpenIosSettings}
            />
        );
    }

    return (
        <View style={styles.body}>
            {content}
            <View style={styles.actions}>
                <Button label="Rename" onClick={handleRename} />
                <Button label="Forget" onClick={handleForget} attention />
            </View>
        </View>
    );
};

export const ComputerRow = ({ row, expanded, onToggle, ...bodyProps }: ComputerRowProps) => {
    const { logEvent } = useLogging('RouteSharingSettings');

    const handlePress = useCallback(() => {
        logEvent({ message: 'button clicked', button: 'computer', eventSource: 'user' });
        onToggle(row.linkId);
    }, [logEvent, onToggle, row.linkId]);

    const subLine = getSubLine(row, bodyProps.now);
    const dotStyle = [styles.dot, { backgroundColor: dotColors[getDotKind(row)] }];

    return (
        <View style={styles.section}>
            <TouchableOpacity
                style={styles.header}
                onPress={handlePress}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`${row.name}, ${subLine}`}
                accessibilityState={{ expanded }}
            >
                <View style={dotStyle} />
                <View style={styles.headerText}>
                    <Text style={styles.name} numberOfLines={1}>{row.name}</Text>
                    <Text style={styles.subLine} numberOfLines={1}>{subLine}</Text>
                </View>
                <Text style={[styles.chevron, expanded && styles.chevronExpanded]}>{'>'}</Text>
            </TouchableOpacity>
            {expanded && <Body row={row} {...bodyProps} />}
        </View>
    );
};

const styles = StyleSheet.create({
    section: {
        borderBottomWidth: 1,
        borderBottomColor: colors.listSeparator,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 54,
        paddingHorizontal: 12,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 12,
    },
    headerText: {
        flex: 1,
    },
    name: {
        color: colors.text,
        fontSize: textSizes.listEntry,
        fontWeight: '500',
    },
    subLine: {
        color: colors.disabled,
        fontSize: textSizes.subtitle,
    },
    chevron: {
        color: colors.text,
        fontSize: textSizes.normalText,
        fontWeight: 'bold',
    },
    chevronExpanded: {
        transform: [{ rotate: '90deg' }],
    },
    body: {
        paddingHorizontal: 12,
        paddingBottom: 12,
    },
    text: {
        color: colors.text,
        fontSize: textSizes.normalText,
        paddingVertical: 3,
    },
    actions: {
        flexDirection: 'row',
        paddingTop: 8,
    },
});
