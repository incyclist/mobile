import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import type { ManualEntryProps } from 'incyclist-services';
import { colors, textSizes } from '../../theme';
import { Button } from '../ButtonBar/ButtonBar';
import { ServerTextField } from './ServerTextField';

interface ManualEntryComponentProps {
    /** phone: Check inline next to the address, name only after the check */
    compact: boolean;
    manual: ManualEntryProps;
    trustNote: string;
    onSetUrl: (url: string) => void;
    onSetName: (name: string) => void;
    onCheckAndAdd: () => void;
    onCheck: () => void;
    onAdd: () => void;
    onConfirmAddEmpty: () => void;
    onCancelAddEmpty: () => void;
}

/** each variant only takes the props it uses */
type WideEntryProps = Omit<ManualEntryComponentProps, 'compact' | 'onCheck'>;
type CompactEntryProps = Omit<ManualEntryComponentProps, 'compact' | 'onCheckAndAdd' | 'onAdd'>;

const NAME_LABEL = 'Name (shown in your route list) *';

const isLocked = (state: ManualEntryProps['state']) => state !== 'idle' && state !== 'error';

const Message = ({ manual }: { manual: ManualEntryProps }) => {
    const { message, state, resolvedUrl, url } = manual;
    return (
        <>
            {!!resolvedUrl && resolvedUrl !== url && (
                <Text style={styles.hint}>{`Address: ${resolvedUrl}`}</Text>
            )}
            {!!message && (
                <Text style={state === 'confirm-empty' ? styles.hint : styles.success}>
                    {state === 'confirm-empty' ? message : `✓ ${message}`}
                </Text>
            )}
        </>
    );
};

const ConfirmEmpty = ({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) => (
    <View style={styles.buttons}>
        <Button label="Add anyway" primary onClick={onConfirm} />
        <Button label="Cancel" onClick={onCancel} />
    </View>
);

const Checking = () => (
    <View style={styles.checking}>
        <ActivityIndicator size="small" color={colors.text} />
        <Text style={styles.hintInline}>Checking…</Text>
    </View>
);

/** Address and name below each other, with the button under the fields (desktop and tablet) */
const WideEntry = ({
    manual,
    trustNote,
    onSetUrl,
    onSetName,
    onCheckAndAdd,
    onAdd,
    onConfirmAddEmpty,
    onCancelAddEmpty,
}: WideEntryProps) => {
    const { state, canSubmit } = manual;
    const locked = isLocked(state);
    let action: React.ReactNode = null;

    if (state === 'checking') {
        action = <Checking />;
    } else if (state === 'confirm-empty') {
        action = <ConfirmEmpty onConfirm={onConfirmAddEmpty} onCancel={onCancelAddEmpty} />;
    } else if (state === 'checked') {
        action = <Button label="Add" primary disabled={!canSubmit} onClick={onAdd} />;
    } else if (state !== 'success') {
        action = <Button label="Check and add" primary disabled={!canSubmit} onClick={onCheckAndAdd} />;
    }

    return (
        <View>
            <ServerTextField
                label="Address"
                value={manual.url}
                placeholder="https://"
                error={!!manual.urlError}
                readOnly={locked}
                onChangeText={onSetUrl}
            />
            {!!manual.localNote && <Text style={styles.hint}>{manual.localNote}</Text>}
            {!!manual.urlError && <Text style={styles.error}>{manual.urlError}</Text>}
            <ServerTextField
                label={NAME_LABEL}
                value={manual.name}
                error={!!manual.nameError}
                readOnly={state === 'checking' || state === 'success'}
                onChangeText={onSetName}
            />
            {!!manual.nameError && <Text style={styles.error}>{manual.nameError}</Text>}
            <Message manual={manual} />
            <Text style={styles.trust}>{trustNote}</Text>
            <View style={styles.action}>{action}</View>
        </View>
    );
};

/** One field per step, Check inline next to the address so the keyboard never hides it (phone) */
const CompactEntry = ({
    manual,
    trustNote,
    onSetUrl,
    onSetName,
    onCheck,
    onConfirmAddEmpty,
    onCancelAddEmpty,
}: CompactEntryProps) => {
    const { state } = manual;
    const checked = state === 'checked' || state === 'confirm-empty' || state === 'success';

    return (
        <View>
            <View style={styles.inlineRow}>
                <ServerTextField
                    value={manual.url}
                    placeholder="https://"
                    error={!!manual.urlError}
                    readOnly={isLocked(state)}
                    autoFocus
                    inline
                    onChangeText={onSetUrl}
                />
                {!checked && (
                    <Button
                        label={state === 'checking' ? 'Checking…' : 'Check'}
                        primary
                        disabled={!manual.canCheck}
                        onClick={onCheck}
                    />
                )}
            </View>
            {!!manual.localNote && <Text style={styles.hint}>{manual.localNote}</Text>}
            {!!manual.urlError && <Text style={styles.error}>{manual.urlError}</Text>}
            <Message manual={manual} />
            {checked && (
                <>
                    <ServerTextField
                        label={NAME_LABEL}
                        value={manual.name}
                        error={!!manual.nameError}
                        readOnly={state === 'success'}
                        onChangeText={onSetName}
                    />
                    {!!manual.nameError && <Text style={styles.error}>{manual.nameError}</Text>}
                </>
            )}
            {state === 'confirm-empty' && (
                <ConfirmEmpty onConfirm={onConfirmAddEmpty} onCancel={onCancelAddEmpty} />
            )}
            {!checked && <Text style={styles.trust}>{trustNote}</Text>}
        </View>
    );
};

export const ManualEntry = ({ compact, ...props }: ManualEntryComponentProps) =>
    compact ? <CompactEntry {...props} /> : <WideEntry {...props} />;

const styles = StyleSheet.create({
    inlineRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    hint: {
        color: colors.text,
        fontSize: textSizes.smallText,
        marginTop: 6,
    },
    hintInline: {
        color: colors.text,
        fontSize: textSizes.normalText,
        marginLeft: 8,
    },
    error: {
        color: '#FFB8B2',
        fontSize: textSizes.smallText,
        marginTop: 6,
    },
    success: {
        color: colors.success,
        fontSize: textSizes.normalText,
        fontWeight: '600',
        marginTop: 8,
    },
    trust: {
        color: colors.disabled,
        fontSize: textSizes.smallText,
        marginTop: 12,
    },
    action: {
        alignItems: 'flex-end',
        marginTop: 8,
    },
    buttons: {
        flexDirection: 'row',
        marginTop: 8,
    },
    checking: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 44,
    },
});
