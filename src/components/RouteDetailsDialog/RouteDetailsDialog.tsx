import React, { useState, useRef, useEffect, useCallback } from 'react';
import { RouteDetailsView } from './RouteDetailsView';
import { RouteDetailsDialogProps } from './types';
import { useLogging, useUnmountEffect } from '../../hooks';
import { getRouteListService } from '../../services';
import { UIStartSettings, UIRouteSettings, DownloadRowDisplayProps } from 'incyclist-services';
import RNFS from 'react-native-fs';

export const RouteDetailsDialog = ({
    routeDescr,
    onClose,
    onStart,
    onCancel,
    onEdit,
    onDelete,
    onShare,
    onExport,
    onDuplicate,
    onImport,
    onImportGpx,
}: RouteDetailsDialogProps) => {
    const { logEvent, logError } = useLogging('RouteDetailsDialog');
    const service = getRouteListService();
    const card = service?.getCard(routeDescr.id);
    const routeId = routeDescr.id;

    const [downloadStatus, setDownloadStatus] = useState<'none' | 'downloading' | 'done' | 'failed'>('none');
    const [showDownloadModal, setShowDownloadModal] = useState(false);
    const refObserver = useRef<any>(null);
    const refInitialized = useRef(false);

    const canStart = routeDescr.canStart ?? false;
    const canEdit = routeDescr.canEdit ?? false;
    const canDelete = routeDescr.canDelete ?? false;
    const canShare = routeDescr.canShare ?? false;
    const canExport = routeDescr.canExport ?? false;
    const canDuplicate = routeDescr.canDuplicate ?? false;
    const canImport = routeDescr.canImport ?? false;
    const canImportGpx = routeDescr.canImportGpx ?? false;

    const hasDownloadableVideo = routeDescr.downloadUrl || (routeDescr.videoUrl?.startsWith('https://'));
    const showDownloadButton = hasDownloadableVideo || routeDescr.requiresDownload === true;

    // Determine download button label and disabled state
    let downloadButtonLabel: string | undefined;
    let downloadButtonDisabled = false;
    if (showDownloadButton) {
        if (downloadStatus === 'downloading') {
            downloadButtonLabel = 'Downloading…';
            downloadButtonDisabled = true;
        } else if (routeDescr.isDownloaded) {
            downloadButtonLabel = 'Downloaded ✓';
        } else if (downloadStatus === 'failed') {
            downloadButtonLabel = 'Retry';
        } else {
            downloadButtonLabel = 'Download';
        }
    }

    const startDisabled = downloadStatus === 'downloading';

    // Subscribe to download observer
    useEffect(() => {
        if (!card || refInitialized.current) return;
        refInitialized.current = true;

        const observer = card.getCurrentDownload();
        if (observer) {
            refObserver.current = observer;
            setDownloadStatus('downloading');

            observer.on('progress', () => {
                setDownloadStatus('downloading');
            });
            observer.on('done', () => {
                setDownloadStatus('done');
                refObserver.current = null;
            });
            observer.on('error', () => {
                setDownloadStatus('failed');
                refObserver.current = null;
            });
        } else if (routeDescr.isDownloaded) {
            setDownloadStatus('done');
        } else {
            setDownloadStatus('none');
        }
    }, [card, routeDescr.isDownloaded]);

    useUnmountEffect(() => {
        if (refObserver.current) {
            refObserver.current.removeAllListeners();
            refObserver.current = null;
        }
    });

    const handleDownloadPress = useCallback(() => {
        if (!card) return;

        if (downloadStatus === 'failed' || downloadStatus === 'none') {
            const videoDir = RNFS.DocumentDirectoryPath + '/videos';
            card.setVideoDir(videoDir);
            card.download();
            logEvent({ message: 'button clicked', button: 'download', eventSource: 'user' });
        } else if (downloadStatus === 'failed') {
            card.download();
            logEvent({ message: 'button clicked', button: 'download-retry', eventSource: 'user' });
        }

        setShowDownloadModal(true);
    }, [card, downloadStatus, logEvent]);

    const handleDownloadModalClose = useCallback(() => {
        setShowDownloadModal(false);
    }, []);

    const handleStart = useCallback((settings: UIStartSettings) => {
        onStart(settings);
    }, [onStart]);

    const handleCancel = useCallback(() => {
        onCancel();
    }, [onCancel]);

    const handleEdit = useCallback((settings: UIRouteSettings) => {
        onEdit(settings);
    }, [onEdit]);

    const handleDelete = useCallback(() => {
        onDelete();
    }, [onDelete]);

    const handleShare = useCallback(() => {
        onShare();
    }, [onShare]);

    const handleExport = useCallback(() => {
        onExport();
    }, [onExport]);

    const handleDuplicate = useCallback(() => {
        onDuplicate();
    }, [onDuplicate]);

    const handleImport = useCallback(() => {
        onImport();
    }, [onImport]);

    const handleImportGpx = useCallback(() => {
        onImportGpx();
    }, [onImportGpx]);

    const downloadRows: DownloadRowDisplayProps[] = downloadStatus !== 'none' ? [{
        routeId,
        title: routeDescr.title ?? '',
        status: downloadStatus,
    }] : [];

    return (
        <RouteDetailsView
            data={routeDescr}
            canStart={canStart}
            canEdit={canEdit}
            canDelete={canDelete}
            canShare={canShare}
            canExport={canExport}
            canDuplicate={canDuplicate}
            canImport={canImport}
            canImportGpx={canImportGpx}
            startDisabled={startDisabled}
            onStart={handleStart}
            onCancel={handleCancel}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onShare={handleShare}
            onExport={handleExport}
            onDuplicate={handleDuplicate}
            onImport={handleImport}
            onImportGpx={handleImportGpx}
            downloadButtonLabel={downloadButtonLabel}
            downloadButtonDisabled={downloadButtonDisabled}
            onDownloadPress={handleDownloadPress}
            showDownloadModal={showDownloadModal}
            onDownloadModalClose={handleDownloadModalClose}
            downloadRows={downloadRows}
        />
    );
};