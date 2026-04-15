import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouteList, RouteCard } from 'incyclist-services';
import { useLogging, useUnmountEffect } from '../../hooks';
import { DownloadModalView } from './DownloadModalView';
import { DownloadModalProps, DownloadRowDisplayProps, DownloadStatus } from './types';

export const DownloadModal = ({ visible, onClose }: DownloadModalProps) => {
    const service = useRouteList();
    const { logEvent } = useLogging('DownloadModal');
    const [rows, setRows] = useState<DownloadRowDisplayProps[]>([]);
    const refUnsubs = useRef<Array<() => void>>([]);
    const refInitialized = useRef(false);

    const updateRows = useCallback(() => {
        const allRoutes = service.getAllRoutes();
        const cardsWithDownloads = allRoutes
            .map(route => service.getCard(route.description.id))
            .filter((card): card is RouteCard => card !== undefined && card.getCurrentDownload() !== null);

        const newRows = cardsWithDownloads.map(card => {
            const dl = card.getCurrentDownload();
            return {
                routeId: card.getId(),
                title: card.getData().description.title,
                status: dl.status as DownloadStatus,
                pct: dl.progress,
                speed: dl.speed,
                sizeLabel: dl.sizeLabel,
            };
        });
        setRows(newRows);
    }, [service]);

    useEffect(() => {
        if (!visible) {
            // Cleanup on close to avoid background processing
            refUnsubs.current.forEach(unsub => unsub());
            refUnsubs.current = [];
            refInitialized.current = false;
            return;
        }

        if (refInitialized.current) return;
        refInitialized.current = true;

        const allRoutes = service.getAllRoutes();
        const cardsWithDownloads = allRoutes
            .map(route => service.getCard(route.description.id))
            .filter((card): card is RouteCard => card !== undefined && card.getCurrentDownload() !== null);

        cardsWithDownloads.forEach(card => {
            const onUpdate = () => updateRows();
            card.cardObserver.on('update', onUpdate);
            refUnsubs.current.push(() => card.cardObserver.off('update', onUpdate));
        });
        updateRows();

    }, [visible, service, updateRows]);

    useUnmountEffect(() => {
        refUnsubs.current.forEach(unsub => unsub());
        refUnsubs.current = [];
    });

    const handleStop = useCallback((routeId: string) => {
        const card = service.getCard(routeId);
        if (card) {
            card.stopDownload();
            logEvent({ message: 'download stopped', route: card.getData().description.title, eventSource: 'user' });
        }
    }, [service, logEvent]);

    const handleRetry = useCallback((routeId: string) => {
        const card = service.getCard(routeId);
        if (card) {
            card.download();
            logEvent({ message: 'download retried', route: card.getData().description.title, eventSource: 'user' });
        }
    }, [service, logEvent]);

    const handleDelete = useCallback((routeId: string) => {
        const card = service.getCard(routeId);
        if (card) {
            card.delete();
            logEvent({ message: 'download deleted', route: card.getData().description.title, eventSource: 'user' });
        }
    }, [service, logEvent]);

    if (!visible) return null;

    return (
        <DownloadModalView
            visible={visible}
            rows={rows}
            onStop={handleStop}
            onRetry={handleRetry}
            onDelete={handleDelete}
            onClose={onClose}
        />
    );
};