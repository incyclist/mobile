import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { colors, textSizes } from '../../theme';
import { useLogging } from '../../hooks';
import { GLYPH_TEXT, RowStatus, StartNoticeInfo, deviceKind } from './phasedStart';
import { ScrollRows } from './ScrollRows';
import { StartNotice } from './StartNotice';
import { StartDeviceInfo } from './types';

export const ROW_HEIGHT = 44;
const STATUS_WIDTH = 144;
const ACTIONS_WIDTH = 136;
const ACTION_MIN_WIDTH = 64;
const HIT_SLOP = { top: 0, bottom: 0, left: 4, right: 4 };

export type ContentRowInfo = {
    label: string;
    status: RowStatus;
};

export type PhasedStartContentProps = {
    /** the single line slot below the heading (devices / content phase) */
    line?: string;
    /** pinned ready-phase summary; takes the place of the line slot */
    notice?: StartNoticeInfo;
    /** phones under 340 dp tall: the notice shows its first line only */
    shortScreen?: boolean;
    /** one line with ellipsis (phone) instead of wrapping */
    compact: boolean;
    controls: StartDeviceInfo[];
    sensors: StartDeviceInfo[];
    content?: ContentRowInfo;
    /** show the "Optional" divider between blocking rows and sensor rows */
    showDivider?: boolean;
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

type ActionLinkProps = { label: string; name: string; device: StartDeviceInfo; onPress: (udid: string) => void };

const ActionLink = ({ label, name, device, onPress }: ActionLinkProps) => {
    const { logEvent } = useLogging('Incyclist');
    const onClick = () => {
        logEvent({ message: 'button clicked', button: label, device: name, isControl: !!device.isControl, eventSource: 'user' });
        onPress(device.udid);
    };

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${label} ${name}`}
            hitSlop={HIT_SLOP}
            onPress={onClick}
            style={styles.actionLink}
        >
            <Text style={styles.actionText}>{label}</Text>
        </Pressable>
    );
};

type RowProps = {
    label: string;
    /** second line below the name: what kind of device this is */
    kind?: string;
    status: RowStatus;
    device?: StartDeviceInfo;
    reserveActions: boolean;
    onRetryDevice?: (udid: string) => void;
    onIgnoreDevice?: (udid: string) => void;
};

const Row = ({ label, kind, status, device, reserveActions, onRetryDevice, onIgnoreDevice }: RowProps) => {
    const showRetry = !!device?.canRetry && !!onRetryDevice;
    const showIgnore = !!device?.canIgnore && !!onIgnoreDevice;
    return (
        <View style={styles.row} testID={device ? `start-row-${device.udid}` : 'start-row-content'}>
            <View style={styles.labelCell}>
                <Text style={[styles.name, status.muted && styles.muted]} numberOfLines={1}>{label}</Text>
                {kind ? <Text style={styles.kind} numberOfLines={1}>{kind}</Text> : null}
            </View>
            <View style={styles.statusCell}>
                <StatusGlyph status={status} />
                <Text style={[styles.statusText, { color: status.color }]} numberOfLines={1}>{status.text}</Text>
            </View>
            {reserveActions ? (
                <View style={styles.actionsCell}>
                    {showRetry && <ActionLink label="Retry" name={label} device={device!} onPress={onRetryDevice!} />}
                    {showIgnore && <ActionLink label="Ignore" name={label} device={device!} onPress={onIgnoreDevice!} />}
                </View>
            ) : null}
        </View>
    );
};

const hasActions = (devices: StartDeviceInfo[], onRetry?: unknown, onIgnore?: unknown) =>
    devices.some(d => (!!d.canRetry && !!onRetry) || (!!d.canIgnore && !!onIgnore));

const Divider = () => (
    <View style={styles.divider} testID="start-optional-divider">
        <View style={styles.dividerLine} />
        <Text style={styles.dividerLabel}>Optional</Text>
        <View style={styles.dividerLine} />
    </View>
);

export const PhasedStartContent = ({
    line, notice, shortScreen, compact, controls, sensors, content, showDivider = sensors.length > 0,
    statusOf, onRetryDevice, onIgnoreDevice,
}: PhasedStartContentProps) => {
    const reserveActions = hasActions([...controls, ...sensors], onRetryDevice, onIgnoreDevice);

    const renderDevice = (device: StartDeviceInfo) => (
        <Row
            key={device.udid}
            label={device.name}
            kind={device.isControl ? 'Trainer' : deviceKind(device)}
            status={statusOf(device)}
            device={device}
            reserveActions={reserveActions}
            onRetryDevice={onRetryDevice}
            onIgnoreDevice={onIgnoreDevice}
        />
    );

    return (
        <View style={styles.container}>
            {notice ? <StartNotice notice={notice} shortScreen={shortScreen} /> : null}
            {!notice && line ? (
                <Text style={styles.line} numberOfLines={compact ? 1 : undefined} ellipsizeMode="tail" testID="start-line">
                    {line}
                </Text>
            ) : null}
            <ScrollRows>
                {controls.map(renderDevice)}
                {content ? <Row label={content.label} status={content.status} reserveActions={reserveActions} /> : null}
                {showDivider && <Divider />}
                {sensors.map(renderDevice)}
            </ScrollRows>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexShrink: 1,
        minHeight: 0,
        paddingHorizontal: 16,
        paddingVertical: 0,
    },
    line: {
        color: colors.disabled,
        fontSize: textSizes.normalText,
        paddingBottom: 8,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        height: ROW_HEIGHT,
    },
    labelCell: {
        flex: 1,
        minWidth: 0,
        justifyContent: 'center',
    },
    name: {
        color: colors.text,
        fontSize: textSizes.normalText,
        lineHeight: 20,
    },
    kind: {
        color: colors.disabled,
        fontSize: textSizes.smallText,
        lineHeight: 15,
    },
    muted: {
        color: colors.disabled,
    },
    statusCell: {
        width: STATUS_WIDTH,
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
        width: ACTIONS_WIDTH,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 8,
    },
    actionLink: {
        minWidth: ACTION_MIN_WIDTH,
        height: ROW_HEIGHT,
        alignItems: 'center',
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
        height: 16,
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
