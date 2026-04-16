import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import RNFS from 'react-native-fs';
import { useRouteList, useActivityList } from 'incyclist-services';
import type { DownloadRowDisplayProps, UIRouteSettings, UIStartSettings } from 'incyclist-services';
import { useLogging, useUnmountEffect } from '../../hooks';
import { RouteDetailsView } from './RouteDetailsView';
import { RouteDetailsDialogProps } from './types';

export const RouteDetailsDialog = ({ routeId,onStart }:RouteDetailsDialogProps ) => {
    const { height } = useWindowDimensions();
    const compact = height < 420;
    
    const service = useRouteList();
    const activities = useActivityList();
    const card = service.getCard(routeId);
    
    const { logEvent } = useLogging('RouteDetailsDialog');
    const refMounted = useRef(true);
    const refInitialized = useRef(false);
    const refDownloadObserver = useRef<any>(null);
    
    const [cardProps, setCardProps] = useState(() => card?.openSettings());
    const [loading, setLoading] = useState(false);
    const [prevRides, setPrevRides] = useState<any[] | null>(null);
    const [showPrev, setShowPrev] = useState(false);

    const route = card?.getData();
    const routeDescr = route?.description;

    const [downloadStatus, setDownloadStatus] = useState<'none' | 'downloading' | 'done' | 'failed'>(() => {
        if (routeDescr?.isDownloaded) return 'done';
        if (card?.getCurrentDownload()) return 'downloading';
        return 'none';
    });
    const [showDownloadModal, setShowDownloadModal] = useState(false);

    const refreshPrevRides = useCallback(async (settings: UIRouteSettings) => {
        if (!card) return { prevRides: undefined, showPrev: false };
        const data = card.getData();
        const routeHash = data.description.routeHash;
        const rId = !routeHash ? data.description.id : undefined;
        
        const prev = await activities.getPastActivitiesWithDetails({
            routeHash,
            routeId: rId,
            startPos: settings.startPos?.value,
            endPos: settings.endPos?.value,
            realityFactor: settings.realityFactor
        });

        if (!refMounted.current) return { prevRides: undefined, showPrev: false };
        
        const hasPrev = prev?.length > 0;
        setPrevRides(hasPrev ? prev : null);
        setShowPrev(hasPrev);
        return { prevRides: hasPrev ? prev : undefined, showPrev: hasPrev };
    }, [card, activities]);

    useEffect(() => {
        if (!card || refInitialized.current) return;
        refInitialized.current = true;
        
        const currentProps = card.openSettings();
        setCardProps(currentProps);
        
        const data = card.getData();
        
        if (!data.details) {
            setLoading(true);
            service.getRouteDetails(routeId)
                .then(() => { if (refMounted.current) setLoading(false); })
                .catch(() => { if (refMounted.current) setLoading(false); });
        }

        refreshPrevRides(currentProps.settings as UIRouteSettings);
        logEvent({ message: 'dialog shown', title:'select route',route: data.description.title });
    }, [routeId, card, service, refreshPrevRides, logEvent]);

    useEffect(() => {
        if (!card) return;
        
        const subscribe = (observer: any) => {
            if (!observer || refDownloadObserver.current === observer) return;
            refDownloadObserver.current = observer;

            const onProgress = () => setDownloadStatus('downloading');
            const onDone = () => {
                setDownloadStatus('done');
                refDownloadObserver.current = null;
            };
            const onError = () => {
                setDownloadStatus('failed');
                refDownloadObserver.current = null;
            };

            observer.on('progress', onProgress);
            observer.on('done', onDone);
            observer.on('error', onError);

            return () => {
                observer.off('progress', onProgress);
                observer.off('done', onDone);
                observer.off('error', onError);
                refDownloadObserver.current = null;
            };
        };

        const currentObserver = card.getCurrentDownload();
        if (currentObserver) {
            return subscribe(currentObserver);
        }
    }, [card]);

    useUnmountEffect(() => {
        refMounted.current = false;
    });

    if (!card || !cardProps || !routeDescr) return null;

    const { 
        totalDistance, 
        totalElevation, 
        showLoopOverwrite, 
        showNextOverwrite, 
        hasWorkout, 
        canStart: cardCanStart, 
        updateStartPos, 
        settings 
    } = cardProps;

    const { hasVideo, hasGpx, isLoop, videoFormat, previewUrl, segments } = routeDescr;
    const points = route.details?.points ?? route.points;
    const routeType = `${hasVideo ? 'Video' : 'GPX'} - ${isLoop ? 'Loop' : 'Point to Point'}`;
    const isAvi = videoFormat?.toLowerCase() === 'avi';
    const canStart = !isAvi && (cardCanStart ?? true) && downloadStatus !== 'downloading';
    const canNotStartReason = isAvi ? 'AVI videos are not supported on mobile' : undefined;

    const hasDownloadUrl = !!(routeDescr.downloadUrl || (routeDescr.videoUrl?.startsWith('https://')));
    const showDownloadButton = hasDownloadUrl || routeDescr.requiresDownload === true;

    let downloadButtonLabel: string | undefined;
    let downloadButtonDisabled = false;

    if (showDownloadButton) {
        if (downloadStatus === 'downloading') {
            downloadButtonLabel = 'Downloading…';
            downloadButtonDisabled = true;
        } else if (downloadStatus === 'done') {
            downloadButtonLabel = 'Downloaded ✓';
        } else if (downloadStatus === 'failed') {
            downloadButtonLabel = 'Retry Download';
        } else {
            downloadButtonLabel = 'Download';
        }
    }

    const onDownloadPress = useCallback(() => {
        if (downloadStatus === 'none' || downloadStatus === 'failed') {
            const videoDir = RNFS.DocumentDirectoryPath + '/videos';
            card.setVideoDir(videoDir);
            card.download();
            logEvent({ 
                message: 'button clicked', 
                button: downloadStatus === 'failed' ? 'download-retry' : 'download', 
                eventSource: 'user' 
            });
        } else {
            logEvent({ message: 'button clicked', button: 'download', eventSource: 'user' });
        }
        setShowDownloadModal(true);
    }, [card, downloadStatus, logEvent]);

    const onDownloadModalClose = useCallback(() => {
        setShowDownloadModal(false);
    }, []);

    const onDownloadStop = useCallback((id: string) => {
        service.getCard(id)?.stopDownload();
    }, [service]);

    const onDownloadRetry = useCallback((id: string) => {
        const c = service.getCard(id);
        if (c) {
            const videoDir = RNFS.DocumentDirectoryPath + '/videos';
            c.setVideoDir(videoDir);
            c.download();
        }
    }, [service]);

    const onDownloadDelete = useCallback((id: string) => {
        service.getCard(id)?.delete();
    }, [service]);

    const downloadRows: DownloadRowDisplayProps[] = downloadStatus !== 'none' ? [{
        routeId,
        title: routeDescr.title ?? '',
        status: downloadStatus,
    }] : []

    const downloadButtonPrimary = routeDescr.requiresDownload === true

    return (
        <RouteDetailsView
            title={routeDescr.title ?? ''}
            compact={compact}
            hasGpx={hasGpx ?? false}
            points={points}
            previewUrl={previewUrl}
            totalDistance={totalDistance}
            totalElevation={totalElevation}
            routeType={routeType}
            videoFormat={videoFormat}
            segments={segments}
            canStart={canStart}
            canNotStartReason={canNotStartReason}
            showLoopOverwrite={!!showLoopOverwrite}
            showNextOverwrite={!!showNextOverwrite}
            downloadButtonPrimary={downloadButtonPrimary}
            showWorkout={!hasWorkout}
            showPrev={showPrev}
            loading={loading}
            initialSettings={settings as UIRouteSettings}
            prevRides={prevRides ?? undefined}
            onStart={(updatedSettings) => {
                card.changeSettings(updatedSettings);
                card.start();
                onStart();
            }}
            onCancel={() => {
                card.cancel();
            }}
            onStartWithWorkout={(updatedSettings) => {
                card.changeSettings(updatedSettings);
                card.addWorkout();
            }}
            onSettingsChanged={refreshPrevRides}
            onUpdateStartPos={(value) => {
                if (!updateStartPos) return null;
                const result = updateStartPos(value);
                if (!result) return null;
                return {
                    ...(cardProps.settings as UIStartSettings),
                    ...result
                };
            }}
            downloadButtonLabel={downloadButtonLabel}
            downloadButtonDisabled={downloadButtonDisabled}
            onDownloadPress={onDownloadPress}
            showDownloadModal={showDownloadModal}
            onDownloadModalClose={onDownloadModalClose}
            downloadRows={downloadRows}
            onDownloadStop={onDownloadStop}
            onDownloadRetry={onDownloadRetry}
            onDownloadDelete={onDownloadDelete}
        />
    );
};