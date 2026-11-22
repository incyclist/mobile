import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { colors, textSizes } from '../../theme';
import { GLYPH_TEXT, RowStatus } from './phasedStart';
import { StartDeviceInfo } from './types';

const HIT_SLOP = { top: 10, bottom: 10, left: 8, right: 8 };

export type ContentRowInfo = {
    label: string;
    status: RowStatus;
};

export type PhasedStartContentProps = {
    /** the single line slot below the heading */
    line?: string;
    /** one line with ellipsis (phone) instead of wrapping */
    compact: boolean;
    controls: StartDeviceInfo[];
    sensors: StartDeviceInfo[];
    content?: ContentRowInfo;
    statusOf: (device: StartDeviceInfo) => RowStatus;
    onRetryDevice?: (udid: string) => void;
    onIgnoreDevice?: (udid: string) => void;
};

const StatusGlyph = ({ status }: { status: RowStatus }) => {
    if (status.glyph === 'spinner') {
        return <ActivityIndicator size="small" color={status.color} style={styles.glyph} />;
    }
    return <Text style={[styles.glyph, { color: status.color }]}>{GLYPH_TEXT[status.glyph]}</Text>;
};

const ActionLink = ({ label, name, onPress }: { label: string; name: string; onPress: () => void }) => (
    <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label} ${name}`}
        hitSlop={HIT_SLOP}
        onPress={onPress}
        style={styles.actionLink}
    >
        <Text style={styles.actionText}>{label}</Text>
    </Pressable>
);

type RowProps = {
    label: string;
    status: RowStatus;
    device?: StartDeviceInfo;
    onRetryDevice?: (udid: string) => void;
    onIgnoreDevice?: (udid: string) => void;
};

const Row = ({ label, status, device, onRetryDevice, onIgnoreDevice }: RowProps) => {
    const showRetry = !!device?.canRetry && !!onRetryDevice;
    const showIgnore = !!device?.canIgnore && !!onIgnoreDevice;
    return (
        <View style={styles.row} testID={device ? `start-row-${device.udid}` : 'start-row-content'}>
            <Text style={[styles.labelCell, status.muted && styles.muted]} numberOfLines={1}>{label}</Text>
            <View style={styles.statusCell}>
                <StatusGlyph status={status} />
                <Text style={[styles.statusText, { color: status.color }]} numberOfLines={1}>{status.text}</Text>
            </View>
            <View style={styles.actionsCell}>
                {showRetry && <ActionLink label="Retry" name={label} onPress={() => onRetryDevice!(device!.udid)} />}
                {showIgnore && <ActionLink label="Ignore" name={label} onPress={() => onIgnoreDevice!(device!.udid)} />}
            </View>
        </View>
    );
};

export const PhasedStartContent = ({
    line, compact, controls, sensors, content, statusOf, onRetryDevice, onIgnoreDevice,
}: PhasedStartContentProps) => {
    const renderDevice = (device: StartDeviceInfo) => (
        <Row
            key={device.udid}
            label={device.name}
            status={statusOf(device)}
            device={device}
            onRetryDevice={onRetryDevice}
            onIgnoreDevice={onIgnoreDevice}
        />
    );

    return (
        <View style={styles.container}>
            {line ? (
                <Text style={styles.line} numberOfLines={compact ? 1 : undefined} ellipsizeMode="tail" testID="start-line">
                    {line}
                </Text>
            ) : null}
            <View style={styles.listContainer}>
                {controls.map(renderDevice)}
                {content ? <Row label={content.label} status={content.status} /> : null}
                {sensors.length > 0 && (
                    <View style={styles.divider} testID="start-optional-divider">
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerLabel}>Optional</Text>
                        <View style={styles.dividerLine} />
                    </View>
                )}
                {sensors.map(renderDevice)}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingVertical: 4,
    },
    line: {
        color: colors.disabled,
        fontSize: textSizes.normalText,
        paddingBottom: 8,
    },
    listContainer: {
        width: '100%',
    },
    row: {
        flexDirection: 'row',
        paddingVertical: 2,
        alignItems: 'center',
        minHeight: 28,
    },
    labelCell: {
        width: '40%',
        color: colors.text,
        fontSize: textSizes.normalText,
    },
    muted: {
        color: colors.disabled,
    },
    statusCell: {
        width: '32%',
        flexDirection: 'row',
        alignItems: 'center',
    },
    glyph: {
        width: 20,
        marginRight: 4,
        fontSize: textSizes.normalText,
        textAlign: 'center',
    },
    statusText: {
        flexShrink: 1,
        fontSize: textSizes.normalText,
    },
    actionsCell: {
        width: '28%',
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    actionLink: {
        marginLeft: 16,
        minHeight: 28,
        justifyContent: 'center',
    },
    actionText: {
        color: colors.link,
        fontSize: textSizes.normalText,
        textDecorationLine: 'underline',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 2,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: colors.dialogBorder,
        opacity: 0.4,
    },
    dividerLabel: {
        color: colors.disabled,
        fontSize: textSizes.smallText,
        paddingHorizontal: 8,
    },
});
