import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { RouteServersSettingsDisplayProps } from 'incyclist-services';
import { colors, textSizes } from '../../theme';
import { KnownServers } from './KnownServers';
import { ManualEntry } from './ManualEntry';
import type { RouteServersActions } from './types';

interface AddServerContentProps {
    compact: boolean;
    displayProps: RouteServersSettingsDisplayProps;
    actions: RouteServersActions;
}

const SubTitle = ({ children }: { children: string }) => <Text style={styles.subTitle}>{children}</Text>;

/** Phone, first step: the known servers and a way to the manual entry */
const CompactAddStart = ({ displayProps, actions }: Omit<AddServerContentProps, 'compact'>) => (
    <View>
        <KnownServers
            known={displayProps.known}
            knownNote={displayProps.knownNote}
            onAdd={actions.onAddKnown}
            onRetry={actions.onRetryKnown}
        />
        <TouchableOpacity
            style={styles.manualRow}
            onPress={actions.onShowManualEntry}
            accessibilityRole="button"
            accessibilityLabel="Enter an address yourself"
        >
            <Text style={styles.manualRowText}>Enter an address yourself</Text>
            <Text style={styles.chevron} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                ›
            </Text>
        </TouchableOpacity>
    </View>
);

export const AddServerContent = ({ compact, displayProps, actions }: AddServerContentProps) => {
    const { view, known, manual, trustNote } = displayProps;

    const manualEntry = (
        <ManualEntry
            compact={compact}
            manual={manual}
            trustNote={trustNote}
            onSetUrl={actions.onSetManualUrl}
            onSetName={actions.onSetManualName}
            onCheckAndAdd={actions.onCheckAndAdd}
            onCheck={actions.onCheck}
            onAdd={actions.onAdd}
            onConfirmAddEmpty={actions.onConfirmAddEmpty}
            onCancelAddEmpty={actions.onCancelAddEmpty}
        />
    );

    if (compact) {
        if (view === 'add-manual' || known.length === 0) {
            return manualEntry;
        }
        return <CompactAddStart displayProps={displayProps} actions={actions} />;
    }

    return (
        <View style={styles.columns}>
            {known.length > 0 && (
                <View style={styles.column}>
                    <SubTitle>Known servers</SubTitle>
                    <KnownServers
                        known={known}
                        knownNote={displayProps.knownNote}
                        onAdd={actions.onAddKnown}
                        onRetry={actions.onRetryKnown}
                    />
                </View>
            )}
            <View style={styles.column}>
                <SubTitle>{known.length > 0 ? 'Or enter an address' : 'Enter an address'}</SubTitle>
                {manualEntry}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    columns: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    column: {
        flex: 1,
        marginHorizontal: 8,
        padding: 10,
        borderWidth: 1,
        borderColor: colors.listSeparator,
        borderRadius: 6,
    },
    subTitle: {
        color: colors.disabled,
        fontSize: textSizes.smallText,
        fontWeight: '700',
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    manualRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 56,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.listSeparator,
    },
    manualRowText: {
        color: colors.text,
        fontSize: textSizes.listEntry,
        fontWeight: '500',
    },
    chevron: {
        color: colors.text,
        fontSize: textSizes.dialogTitle,
    },
});
