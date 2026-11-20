import React, { useMemo } from 'react';
import { View } from 'react-native';
import { RouteServersDialogViewProps } from './types';
import { Dialog } from '../Dialog';
import { ButtonProps } from '../ButtonBar/types';
import { ServerList } from './ServerList';
import { AddServerContent } from './AddServerContent';
import { RemoveServerDialog } from './RemoveServerDialog';

const getTitle = (view: 'list' | 'add' | 'add-manual', compact: boolean): string => {
    if (view === 'list') {
        return 'Route Servers';
    }
    return view === 'add-manual' && compact ? 'Enter an address' : 'Add a route server';
};

/**
 * Pure view of the Route Servers screen (Settings) and of its add view (also reached from
 * the Import Routes dialog). What is shown comes ready-made from the page service.
 */
export const RouteServersDialogView = (props: RouteServersDialogViewProps) => {
    const { compact, displayProps, visible = true, ...actions } = props;
    const { view, isEmpty, manual, removeDialog } = displayProps;
    const { onClose, onBack, onShowAdd, onAdd } = actions;

    const buttons = useMemo(() => {
        const list: ButtonProps[] = [];
        if (view === 'list') {
            if (!isEmpty) {
                list.push({ id: 'add-server', label: '+ Add route server', primary: true, onClick: onShowAdd });
            }
            list.push({ id: 'close', label: 'Close', onClick: onClose });
            return list;
        }

        // phone: the Check button sits inline, only the final Add goes to the footer
        if (compact && manual.state === 'checked') {
            list.push({ id: 'add', label: 'Add', primary: true, disabled: !manual.canSubmit, onClick: onAdd });
        }
        list.push({ id: 'back', label: 'Back', onClick: onBack });
        return list;
    }, [view, isEmpty, compact, manual.state, manual.canSubmit, onShowAdd, onClose, onAdd, onBack]);

    const title = getTitle(view, compact);

    return (
        <>
            <Dialog
                title={title}
                variant="full"
                visible={visible}
                onOutsideClick={view === 'list' ? onClose : onBack}
                buttons={buttons}
            >
                <View>
                    {view === 'list' ? (
                        <ServerList
                            compact={compact}
                            displayProps={displayProps}
                            onAddServer={onShowAdd}
                            onRemove={actions.onRequestRemove}
                        />
                    ) : (
                        <AddServerContent compact={compact} displayProps={displayProps} actions={actions} />
                    )}
                </View>
            </Dialog>
            {removeDialog && (
                <RemoveServerDialog
                    dialog={removeDialog}
                    onSetRemoveRoutes={actions.onSetRemoveRoutes}
                    onConfirm={actions.onConfirmRemove}
                    onCancel={actions.onCancelRemove}
                />
            )}
        </>
    );
};
