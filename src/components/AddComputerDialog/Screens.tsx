import React, { useCallback, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import type { DiscoveredComputer, DiscoveryState, SyncStateName } from 'incyclist-services';
import { colors, textSizes } from '../../theme';
import { useLogging } from '../../hooks';
import { RouteSharingChecklist } from '../RouteSharingChecklist';
import { CodeEntry } from './CodeEntry';
import { getFailureMessage, getWrongCodeMessage } from './utils';

const PREREQUISITE = 'On the computer, Settings › Routes › Route Sharing › Connect your phone or tablet must be open.';
const MAX_NAME_LENGTH = 40;
const AFTER_ADDING = (name: string) =>
    `They'll appear in your Routes list. They play while ${name} is on and you're on the same Wi‑Fi — download the ones you want to ride elsewhere.`;

export const Heading = ({ title, text }: { title: string, text?: string }) => (
    <View style={styles.block}>
        <Text style={styles.title}>{title}</Text>
        {text ? <Text style={styles.text}>{text}</Text> : null}
    </View>
);

const ComputerItem = ({ computer, onSelect }: { computer: DiscoveredComputer, onSelect: (id: string) => void }) => {
    const { logEvent } = useLogging('AddComputerDialog');
    const already = computer.linkId !== undefined;
    const handlePress = useCallback(() => {
        logEvent({ message: 'button clicked', button: 'computer', eventSource: 'user' });
        onSelect(computer.id);
    }, [logEvent, onSelect, computer.id]);

    return (
        <TouchableOpacity
            style={styles.row}
            onPress={handlePress}
            disabled={already}
            accessibilityRole="button"
            accessibilityState={{ disabled: already }}
        >
            <View style={styles.rowText}>
                <Text style={styles.rowName} numberOfLines={1}>{computer.displayName}</Text>
                {computer.ambiguous && computer.suffix ? <Text style={styles.sub}>{computer.name}</Text> : null}
                {already ? <Text style={styles.sub}>✓ Already connected</Text> : null}
            </View>
        </TouchableOpacity>
    );
};

interface SearchProps {
    discovery: DiscoveryState;
    onSelect: (id: string) => void;
    onSearchAgain: () => void;
}

/** A-1: the spinner, the prerequisite and the results. */
export const SearchScreen = ({ discovery, onSelect, onSearchAgain }: SearchProps) => {
    const computers = discovery.phase === 'searching' || discovery.phase === 'done' ? discovery.computers : [];
    const searching = discovery.phase !== 'done';
    return (
        <View>
            {searching && (
                <View style={styles.searching}>
                    <ActivityIndicator color={colors.text} />
                    <Text style={styles.searchText}>Looking for computers on your Wi‑Fi…</Text>
                </View>
            )}
            <Text style={styles.prerequisite}>{PREREQUISITE}</Text>
            {computers.map(c => <ComputerItem key={c.id} computer={c} onSelect={onSelect} />)}
            {!searching && <TextButton label="Search Again" onPress={onSearchAgain} />}
        </View>
    );
};

export const TextButton = ({ label, onPress }: { label: string, onPress: () => void }) => {
    const { logEvent } = useLogging('AddComputerDialog');
    const handlePress = useCallback(() => {
        logEvent({ message: 'button clicked', button: label, eventSource: 'user' });
        onPress();
    }, [logEvent, label, onPress]);
    return (
        <TouchableOpacity onPress={handlePress} accessibilityRole="button" style={styles.textButton}>
            <Text style={styles.link}>{label}</Text>
        </TouchableOpacity>
    );
};

export const NoneFoundScreen = ({ showLocalNetworkHint }: { showLocalNetworkHint: boolean }) => (
    <View style={styles.block}>
        <RouteSharingChecklist variant="find" showLocalNetworkHint={showLocalNetworkHint} />
    </View>
);

export const BlockedScreen = () => (
    <Heading
        title="Can't search right now"
        text="Incyclist is busy looking for your trainer or sensors. Try again when that has finished."
    />
);

export const ConnectingScreen = ({ name }: { name: string }) => (
    <View style={styles.searching}>
        <ActivityIndicator color={colors.text} />
        <Text style={styles.searchText}>{`Connecting to ${name}…`}</Text>
    </View>
);

export const NotReadyScreen = ({ name }: { name: string }) => (
    <Heading
        title={`${name} isn't ready to connect`}
        text={`On ${name}, open Settings › Routes › Route Sharing and click "Connect your phone or tablet". Keep that window open, then tap Try Again.`}
    />
);

interface CodeScreenProps {
    name: string;
    wrong: boolean;
    attemptsLeft?: number;
    compact: boolean;
    onSubmitCode: (pin: string) => void;
    onCancel: () => void;
    onBack: () => void;
}

/** A-4. On a phone the keyboard hides the footer: Cancel moves to the top and the rest may be covered. */
export const CodeScreen = ({ name, wrong, attemptsLeft, compact, onSubmitCode, onCancel, onBack }: CodeScreenProps) => (
    <View style={styles.block}>
        {compact && (
            <View style={styles.headerAction}>
                <TextButton label="Cancel" onPress={onCancel} />
            </View>
        )}
        <Text style={styles.text}>{`Enter the 6‑digit code shown on ${name}.`}</Text>
        {wrong ? <Text style={styles.error}>{getWrongCodeMessage(attemptsLeft)}</Text> : null}
        <CodeEntry key={`code-${attemptsLeft ?? 'new'}`} compact={compact} onSubmit={onSubmitCode} />
        <Text style={styles.sub}>It's only needed once — this device stays connected afterwards.</Text>
        <TextButton label="No code on that screen?" onPress={onBack} />
    </View>
);

export const FailedScreen = ({ name, reason, seconds }: { name: string, reason: Parameters<typeof getFailureMessage>[0], seconds: number }) => (
    <View style={styles.block}>
        <Text style={styles.error}>{getFailureMessage(reason, name, seconds)}</Text>
    </View>
);

interface ConnectedProps {
    name: string;
    already: boolean;
    routeCount?: number;
    sync?: SyncStateName;
    onNameChange: (name: string) => void;
}

const SyncStatus = ({ name, sync, routeCount }: { name: string, sync?: SyncStateName, routeCount?: number }) => {
    switch (sync) {
        case 'syncing':
            return (
                <>
                    <View style={styles.searching}>
                        <ActivityIndicator color={colors.text} />
                        <Text style={styles.searchText}>{`Adding routes from ${name}…`}</Text>
                    </View>
                    <Text style={styles.text}>{AFTER_ADDING(name)}</Text>
                </>
            );
        case 'done':
            return routeCount ? (
                <>
                    <Text style={styles.text}>{`Connected • ${routeCount} ${routeCount === 1 ? 'route' : 'routes'}`}</Text>
                    <Text style={styles.text}>{AFTER_ADDING(name)}</Text>
                </>
            ) : (
                <Text style={styles.text}>
                    {`Connected to ${name}. It isn't sharing any routes yet — routes with a video that you add to Incyclist on ${name} will appear here.`}
                </Text>
            );
        case 'failed':
            return <Text style={styles.text}>{`Connected to ${name}, but the routes could not be loaded. Tap Check Again to try once more.`}</Text>;
        case 'media-unavailable':
            return (
                <Text style={styles.text}>
                    {`Connected to ${name}. This device cannot load routes from your computer yet.`}
                </Text>
            );
        default:
            return <Text style={styles.text}>{`Connected to ${name}.`}</Text>;
    }
};

/** A-5 and A-6. */
export const ConnectedScreen = ({ name, already, routeCount, sync, onNameChange }: ConnectedProps) => {
    const [value, setValue] = useState(name);
    const handleChange = useCallback((text: string) => {
        setValue(text);
        onNameChange(text);
    }, [onNameChange]);

    if (already) {
        return (
            <View style={styles.block}>
                <Text style={styles.text}>{`${name} is already connected to this device.`}</Text>
            </View>
        );
    }

    return (
        <View style={styles.block}>
            <SyncStatus name={name} sync={sync} routeCount={routeCount} />
            <Text style={styles.label}>Name on this device</Text>
            <TextInput
                style={styles.input}
                value={value}
                onChangeText={handleChange}
                maxLength={MAX_NAME_LENGTH}
                accessibilityLabel="Name on this device"
                placeholderTextColor={colors.disabled}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    block: {
        padding: 16,
    },
    title: {
        color: colors.text,
        fontSize: textSizes.listEntry,
        fontWeight: '700',
        paddingBottom: 8,
    },
    text: {
        color: colors.text,
        fontSize: textSizes.normalText,
        paddingVertical: 4,
    },
    sub: {
        color: colors.disabled,
        fontSize: textSizes.subtitle,
        paddingVertical: 4,
    },
    error: {
        color: colors.text,
        fontSize: textSizes.normalText,
        paddingVertical: 6,
    },
    searching: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    searchText: {
        color: colors.text,
        fontSize: textSizes.normalText,
        marginLeft: 12,
    },
    prerequisite: {
        color: colors.disabled,
        fontSize: textSizes.subtitle,
        paddingHorizontal: 16,
        paddingBottom: 8,
    },
    row: {
        minHeight: 54,
        paddingHorizontal: 16,
        justifyContent: 'center',
        borderBottomWidth: 1,
        borderBottomColor: colors.listSeparator,
    },
    rowText: {
        flexDirection: 'column',
    },
    rowName: {
        color: colors.text,
        fontSize: textSizes.listEntry,
    },
    textButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        alignSelf: 'flex-start',
    },
    link: {
        color: colors.link,
        fontSize: textSizes.normalText,
    },
    headerAction: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    label: {
        color: colors.text,
        fontSize: textSizes.normalText,
        paddingTop: 12,
    },
    input: {
        color: colors.text,
        fontSize: textSizes.normalText,
        borderBottomWidth: 1,
        borderBottomColor: colors.listSeparator,
        paddingVertical: 4,
    },
});
