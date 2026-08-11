import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { useRouteList, useActivityList, getRoutesPageService } from 'incyclist-services';
import type { DownloadRowDisplayProps, UIRouteSettings, UIStartSettings, RouteDetailsProps } from 'incyclist-services';
import { useLogging, useUnmountEffect } from '../../hooks';
import { RouteDetailsView } from './RouteDetailsView';
import { RouteDetailsDialogProps } from './types';

export const RouteDetailsDialog = ({ routeId, onStart }: RouteDetailsDialogProps) => {
    const { height } = useWindowDimensions();
    const compact = height < 420;

    const service = useRouteList();
    const activities = useActivityList();
    const pageService = getRoutesPageService();
    const card = service.getCard(routeId);

    const { logEvent } = useLogging('RouteDetailsDialog');
    const refMounted = useRef(true);
    const refInitialized = useRef(false);
    const refDownloadObserver = useRef<any>(null);

    const [cardProps, setCardProps] = useState(() => card?.openSettings());
    const [loading, setLoading] = useState(false);
    const [prevRides, setPrevRides] = useState<any[] | null>(null);
    const [showPrev, setShowPrev] = useState(false);
    const [showDownloadModal, setShowDownloadModal] = useState(false);

    // Phase 2 (workout-mobile-hld-phase2.md §4.2/§9.1) - additive side-channel, kept fresh on
    // every 'page-update', separate from `cardProps` above (which is intentionally captured once
    // - see workout-combo-service-design.md §3.5.1). RouteDetailsView follows the "one source per
    // state" rule: this drives the button/chip when comboEnabled, `cardProps.showWorkoutOption`
    // drives it otherwise - the two are never mixed for the same render.
    const [routeDetailsProps, setRouteDetailsProps] = useState<RouteDetailsProps>(() =>
        pageService.getRouteDetailsProps(routeId)
    );

    const route = card?.getData();
    const routeDescr = route?.description;

    // Full download row state — carries pct so progress bar updates correctly
    const [downloadRow, setDownloadRow] = useState<DownloadRowDisplayProps | null>(() => {
        if (routeDescr?.isDownloaded) return { routeId, title: routeDescr.title ?? '', status: 'done' }
        if (card?.getCurrentDownload()) return { routeId, title: routeDescr?.title ?? '', status: 'downloading' }
        return null
    });

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
        logEvent({ message: 'dialog shown', title: 'select route', route: data.description.title });
    }, [routeId, card, service, refreshPrevRides, logEvent]);

    const subscribeToObserver = useCallback((observer: any) => {
        if (!observer || refDownloadObserver.current === observer) return;
        refDownloadObserver.current = observer;

        const title = routeDescr?.title ?? '';

        const onProgress = (pct: string, _speed: string) => {
            setDownloadRow({
                routeId,
                title,
                status: 'downloading',
                pct: parseFloat(pct),                
            })
        };
        const onDone = () => {
            setDownloadRow({ routeId, title, status: 'done' });
            refDownloadObserver.current = null;
        };
        const onError = () => {
            setDownloadRow({ routeId, title, status: 'failed' });
            refDownloadObserver.current = null;
        };
        const onStopped = () => {
            setDownloadRow(null);
            refDownloadObserver.current = null;
        };

        observer.on('progress', onProgress);
        observer.on('done', onDone);
        observer.on('error', onError);
        observer.on('stopped', onStopped);

        return () => {
            observer.off('progress', onProgress);
            observer.off('done', onDone);
            observer.off('error', onError);
            observer.off('stopped', onStopped);
            refDownloadObserver.current = null;
        };
    }, [routeId, routeDescr]);

    // Subscribe to any already-active download observer on mount
    useEffect(() => {
        if (!card) return;
        const currentObserver = card.getCurrentDownload();
        if (currentObserver) {
            return subscribeToObserver(currentObserver);
        }
    }, [card, subscribeToObserver]);

    // Phase 2 (workout-combo-service-design.md §3.7) - the dialog's own page service's
    // 'page-update' is the only subscription this session adds; a cross-screen attach/detach
    // (e.g. clearing the workout from the Workouts page) is picked up on next mount instead, and
    // the in-dialog '[x]' below already re-emits 'page-update' when it clears the selection.
    useEffect(() => {
        const refresh = () => setRouteDetailsProps(pageService.getRouteDetailsProps(routeId));
        const observer = pageService.getPageObserver();

        observer?.on('page-update', refresh);
        return () => {
            observer?.off('page-update', refresh);
        };
    }, [pageService, routeId]);

    const onClearWorkout = useCallback(() => {
        pageService.onClearWorkoutSelection();
    }, [pageService]);

    useUnmountEffect(() => {
        refMounted.current = false;
    });

    if (!card || !cardProps || !routeDescr) return null;

    const {
        totalDistance,
        totalElevation,
        showLoopOverwrite,
        showNextOverwrite,
        showWorkoutOption,
        canStart: cardCanStart,
        updateStartPos,
        settings
    } = cardProps;

    const { hasVideo, hasGpx, isLoop, videoFormat, previewUrl, segments } = routeDescr;
    const points = route.details?.points ?? route.points;
    const routeType = `${hasVideo ? 'Video' : 'GPX'} - ${isLoop ? 'Loop' : 'Point to Point'}`;
    const isAvi = videoFormat?.toLowerCase() === 'avi';
    const downloadStatus = downloadRow?.status ?? 'none'
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
            const observer = card.download();
            setDownloadRow({ routeId, title: routeDescr.title ?? '', status: 'downloading' });
            subscribeToObserver(observer);
        }
        setShowDownloadModal(true);
    }, [card, downloadStatus, routeId, routeDescr, subscribeToObserver]);

    const onDownloadModalClose = useCallback(() => {
        setShowDownloadModal(false);
    }, []);

    const onDownloadStop = useCallback((id: string) => {
        const c = service.getCard(id)
        if (c) {
            c.stopDownload(true);
        }
    }, [service]);

    const onDownloadRetry = useCallback((id: string) => {
        const c = service.getCard(id);
        if (c) {
            const observer = c.download();
            setDownloadRow({ routeId, title: routeDescr.title ?? '', status: 'downloading' });
            subscribeToObserver(observer);
        }
    }, [service, routeId, routeDescr, subscribeToObserver]);

    const onDownloadDelete = useCallback((id: string) => {
        service.getCard(id)?.delete();
        setDownloadRow(null);
    }, [service]);

    const downloadRows: DownloadRowDisplayProps[] = downloadRow ? [downloadRow] : [];
    const downloadButtonPrimary = routeDescr.requiresDownload === true;

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
            showWorkout={!!showWorkoutOption}
            showPrev={showPrev}
            loading={loading}
            initialSettings={settings as UIRouteSettings}
            prevRides={prevRides ?? undefined}
            attachedWorkout={routeDetailsProps.attachedWorkout}
            comboEnabled={routeDetailsProps.comboEnabled}
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
            onClearWorkout={onClearWorkout}
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
