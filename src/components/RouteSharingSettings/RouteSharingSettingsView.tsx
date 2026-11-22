import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, textSizes } from '../../theme';
import { useScreenLayout } from '../../hooks';
import { Dialog } from '../Dialog';
import type { ButtonProps } from '../ButtonBar/types';
import type { RouteSharingSettingsViewProps } from './types';
import { ComputerRow } from './ComputerRow';
import { EmptyState } from './EmptyState';
import { UpdatePrompt } from './UpdatePrompt';
import { RenameDialog } from './RenameDialog';
import { ForgetDialog } from './ForgetDialog';
import { getStoreName } from './utils';

const BLOCKED_NOTICE = "Couldn't look for your computers right now — Incyclist is busy looking for your trainer or sensors. Try again in a moment.";

export const RouteSharingSettingsView = ({
    mode,
    rows,
    checking,
    searchBlocked,
    platform,
    now,
    compact,
    onClose,
    onCheckAgain,
    onAddComputer,
    onRename,
    onForget,
    onOpenIosSettings,
    onOpenStore,
}: RouteSharingSettingsViewProps) => {
    const layout = useScreenLayout();
    const isPhone = compact ?? layout === 'compact';
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [renameId, setRenameId] = useState<string | null>(null);
    const [forgetId, setForgetId] = useState<string | null>(null);

    const handleToggle = useCallback((linkId: string) => {
        setExpandedId(prev => (prev === linkId ? null : linkId));
    }, []);
    const handleRenameStart = useCallback((linkId: string) => setRenameId(linkId), []);
    const handleForgetStart = useCallback((linkId: string) => setForgetId(linkId), []);
    const handleRenameCancel = useCallback(() => setRenameId(null), []);
    const handleForgetCancel = useCallback(() => setForgetId(null), []);

    const renameRow = rows.find(r => r.linkId === renameId);
    const forgetRow = rows.find(r => r.linkId === forgetId);

    const handleRenameSave = useCallback((name: string) => {
        if (renameId) onRename(renameId, name);
        setRenameId(null);
    }, [renameId, onRename]);

    const handleForgetConfirm = useCallback(() => {
        if (forgetId) onForget(forgetId);
        setForgetId(null);
        setExpandedId(null);
    }, [forgetId, onForget]);

    const buttons = useMemo((): ButtonProps[] => {
        if (mode === 'unsupported') {
            return [
                { label: 'Close', onClick: onClose },
                { label: `Open ${getStoreName(platform)}`, onClick: onOpenStore, primary: true },
            ];
        }
        const add: ButtonProps = { label: 'Add Computer', onClick: onAddComputer, primary: true };
        if (mode === 'empty') {
            return [{ label: 'Close', onClick: onClose }, add];
        }
        return [
            { label: 'Close', onClick: onClose },
            { label: checking ? 'Checking…' : 'Check Again', onClick: onCheckAgain, disabled: checking },
            add,
        ];
    }, [mode, platform, checking, onClose, onOpenStore, onAddComputer, onCheckAgain]);

    const currentTime = now ?? Date.now();

    return (
        <>
            <Dialog
                title="Route Sharing"
                variant="full"
                visible={true}
                scrollable={false}
                onOutsideClick={onClose}
                buttons={buttons}
            >
                <View style={styles.container}>
                    <ScrollView style={styles.scroll} bounces={false}>
                        {mode === 'unsupported' && <UpdatePrompt platform={platform} />}
                        {mode === 'empty' && <EmptyState platform={platform} compact={isPhone} />}
                        {mode === 'list' && rows.map(row => (
                            <ComputerRow
                                key={row.linkId}
                                row={row}
                                expanded={expandedId === row.linkId}
                                platform={platform}
                                now={currentTime}
                                onToggle={handleToggle}
                                onRename={handleRenameStart}
                                onForget={handleForgetStart}
                                onOpenIosSettings={onOpenIosSettings}
                            />
                        ))}
                    </ScrollView>
                    {searchBlocked && mode !== 'unsupported' && <Text style={styles.notice}>{BLOCKED_NOTICE}</Text>}
                </View>
            </Dialog>
            {renameRow && <RenameDialog name={renameRow.name} onCancel={handleRenameCancel} onSave={handleRenameSave} />}
            {forgetRow && <ForgetDialog name={forgetRow.name} onCancel={handleForgetCancel} onForget={handleForgetConfirm} />}
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scroll: {
        flex: 1,
    },
    notice: {
        color: colors.warning,
        fontSize: textSizes.subtitle,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
});
