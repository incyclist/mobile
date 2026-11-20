import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    getRouteServersSettingsPageService,
    IObserver,
    RouteServersClosedEvent,
    RouteServersSettingsDisplayProps,
} from 'incyclist-services';
import { RouteServersDialogProps } from './types';
import { RouteServersDialogView } from './RouteServersDialogView';
import { useScreenLayout } from '../../hooks';

/**
 * Smart wrapper of the Route Servers screen. Opens the page service, follows its `page-update`
 * events and forwards the user's actions. The page service closes itself (Back from its first
 * view, or after a server was added from the Import dialog) and then reports `closed` with the reason.
 */
export const RouteServersDialog = ({ origin, onClose }: RouteServersDialogProps) => {
    const compact = useScreenLayout() === 'compact';
    const service = getRouteServersSettingsPageService();
    const [displayProps, setDisplayProps] = useState<RouteServersSettingsDisplayProps>();
    const refOnClose = useRef(onClose);
    refOnClose.current = onClose;

    useEffect(() => {
        const observer: IObserver = service.open(origin);
        let finished = false;

        const handleUpdate = () => {
            if (!finished) {
                setDisplayProps(service.getPageDisplayProps());
            }
        };
        const handleClosed = (event?: RouteServersClosedEvent) => {
            if (finished) {
                return;
            }
            finished = true;
            // the page service decides why it closed; the app only follows
            refOnClose.current(event?.reason ?? 'cancel');
        };

        observer.on('page-update', handleUpdate);
        observer.on('closed', handleClosed);
        handleUpdate();

        return () => {
            finished = true;
            observer.off('page-update', handleUpdate);
            observer.off('closed', handleClosed);
            // closed by the parent: the page service must not keep listening for status changes
            if (service.getPageObserver() === observer) {
                service.close();
            }
        };
    }, [service, origin]);

    const handleClose = useCallback(() => service.close(), [service]);
    const handleBack = useCallback(() => service.back(), [service]);
    const handleShowAdd = useCallback(() => service.showAdd(), [service]);
    const handleShowManualEntry = useCallback(() => service.showManualEntry(), [service]);
    const handleAddKnown = useCallback((id: string) => service.addKnown(id), [service]);
    const handleRetryKnown = useCallback((id: string) => service.retryKnown(id), [service]);
    const handleSetManualUrl = useCallback((url: string) => service.setManualUrl(url), [service]);
    const handleSetManualName = useCallback((name: string) => service.setManualName(name), [service]);
    const handleCheckAndAdd = useCallback(() => service.checkAndAdd(), [service]);
    const handleCheck = useCallback(() => service.check(), [service]);
    const handleAdd = useCallback(() => service.add(), [service]);
    const handleConfirmAddEmpty = useCallback(() => service.confirmAddEmpty(), [service]);
    const handleCancelAddEmpty = useCallback(() => service.cancelAddEmpty(), [service]);
    const handleRequestRemove = useCallback((key: string) => service.requestRemove(key), [service]);
    const handleSetRemoveRoutes = useCallback((remove: boolean) => service.setRemoveRoutes(remove), [service]);
    const handleConfirmRemove = useCallback(() => service.confirmRemove(), [service]);
    const handleCancelRemove = useCallback(() => service.cancelRemove(), [service]);

    if (!displayProps) {
        return null;
    }

    return (
        <RouteServersDialogView
            compact={compact}
            displayProps={displayProps}
            onClose={handleClose}
            onBack={handleBack}
            onShowAdd={handleShowAdd}
            onShowManualEntry={handleShowManualEntry}
            onAddKnown={handleAddKnown}
            onRetryKnown={handleRetryKnown}
            onSetManualUrl={handleSetManualUrl}
            onSetManualName={handleSetManualName}
            onCheckAndAdd={handleCheckAndAdd}
            onCheck={handleCheck}
            onAdd={handleAdd}
            onConfirmAddEmpty={handleConfirmAddEmpty}
            onCancelAddEmpty={handleCancelAddEmpty}
            onRequestRemove={handleRequestRemove}
            onSetRemoveRoutes={handleSetRemoveRoutes}
            onConfirmRemove={handleConfirmRemove}
            onCancelRemove={handleCancelRemove}
        />
    );
};
