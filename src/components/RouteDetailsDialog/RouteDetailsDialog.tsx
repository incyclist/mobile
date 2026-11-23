import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouteList, useActivityList, getRoutesPageService, useOnlineStatusMonitoring } from 'incyclist-services';
import type { DownloadRowDisplayProps, UIRouteSettings, UIStartSettings, RouteDetailsProps, RouteApiDetail, VideoKeepChoice } from 'incyclist-services';
import { useLogging, useUnmountEffect, useIsTablet, useScreenLayout } from '../../hooks';
import { RouteDetailsView } from './RouteDetailsView';
import { RouteDetailsDialogProps, RouteSettingsChangeResult } from './types';
import { navigate } from '../../services';
import { getUnavailableText } from '../RouteSource/utils';
import type { RouteSourceProps } from '../RouteSource/types';
import { useRouteCopyState } from './useRouteCopyState';
import { getCopyButtonLabel, getCopyFailureText, getCopyRow } from './routeCopy';

/**
 * Explains a Start button that is actually unavailable. Being offline is not by itself a reason -
 * a downloaded video plays from local storage and starts fine offline - so this only ever
 * describes a route that genuinely cannot be started. AVI takes precedence when both apply.
 */
const getCanNotStartReason = (props: { canStart: boolean, isAvi: boolean, isOnline: boolean, source: RouteSourceProps }): string | undefined => {
    const { canStart, isAvi, isOnline, source } = props;

    if (canStart)
        return undefined;
    // a route that no source can deliver right now: the reason comes from the page service's state
    if (source.availability === 'unavailable')
        return getUnavailableText(source);
    if (isAvi)
        return 'AVI videos are not supported on mobile';
    if (!isOnline)
        return 'You are offline (no network)';
    return undefined;
};

/**
 * The word for the user's own device in the video copy. It follows the hardware, not the layout:
 * a large phone renders the `full` layout but is still an iPhone, and telling that user their
 * video is "not on this iPad" would be plainly wrong.
 */
const useDeviceWord = (): string => (useIsTablet() ? 'iPad' : 'iPhone');

export const RouteDetailsDialog = ({ routeId, onStart }: RouteDetailsDialogProps) => {
    const compact = useScreenLayout() === 'compact';
    const deviceWord = useDeviceWord();

    const service = useRouteList();
    const activities = useActivityList();
    const pageService = getRoutesPageService();
    const card = service.getCard(routeId);
    // `RouteCard.canStart()` conflates the AVI-unsupported and offline cases into one boolean
    // (`cardCanStart` below), so the offline reason needs its own read here, mirroring how
    // web-ui's RouteDetails wrapper derives `isOnline` separately from `canStart`.
    const onlineStatusMonitor = useOnlineStatusMonitoring();

    const { logEvent, logError } = useLogging('RouteDetailsDialog');
    const refMounted = useRef(true);
    const refInitialized = useRef(false);
    const refDownloadObserver = useRef<any>(null);

    const [cardProps, setCardProps] = useState(() => card?.openSettings());
    // The route details are loaded lazily, so the settings above can be a provisional copy in
    // which distance, elevation and the video location are not known yet. `detailsAvailable`
    // says so, and the dialog shows a loading body until the real values have been read.
    const [loading, setLoading] = useState(() => cardProps?.detailsAvailable === false);
    const [prevRides, setPrevRides] = useState<any[] | null>(null);
    const [showPrev, setShowPrev] = useState(false);
    const [showDownloadModal, setShowDownloadModal] = useState(false);

    // Phase 2 (workout-mobile-hld-phase2.md §4.2) - additive side-channel, kept fresh on every
    // 'page-update', separate from `cardProps` above (which is intentionally captured once).
    // Drives the "Add Workout" button/chip.
    const [routeDetailsProps, setRouteDetailsProps] = useState<RouteDetailsProps>(() =>
        pageService.getRouteDetailsProps(routeId)
    );

    const route = card?.getData();
    const routeDescr = route?.description;

    // A route that plays from (or needs) a computer is copied to this device through the copy
    // service; the Download button then drives that copy instead of a server download.
    const copyable = !!routeDescr?.linkShared && (routeDetailsProps.availability === 'fromLink' || routeDetailsProps.availability === 'unavailable');
    const copyState = useRouteCopyState(routeId, copyable);
    const refCopyStatus = useRef(copyState.state.status);

    // Full download row state — carries pct so progress bar updates correctly
    const [downloadRow, setDownloadRow] = useState<DownloadRowDisplayProps | null>(() => {
        if (routeDescr?.isDownloaded) return { routeId, title: routeDescr.title ?? '', status: 'done' }
        if (card?.getCurrentDownload()) return { routeId, title: routeDescr?.title ?? '', status: 'downloading' }
        return null
    });

    // The criteria (including the smoothing-level eligibility prediction) are built by the card,
    // not re-derived here - see RouteCard.getPrevRidesFilter().
    const refreshPrevRides = useCallback(async (settings: UIRouteSettings) => {
        if (!card) return { prevRides: undefined, showPrev: false };

        const filter = card.getPrevRidesFilter(settings);
        const prev = await activities.getPastActivitiesWithDetails(filter);

        if (!refMounted.current) return { prevRides: undefined, showPrev: false };

        const hasPrev = prev?.length > 0;
        setPrevRides(hasPrev ? prev : null);
        setShowPrev(hasPrev);
        return { prevRides: hasPrev ? prev : undefined, showPrev: hasPrev };
    }, [card, activities]);

    /**
     * One round-trip for everything a settings change implies: which past activities are
     * comparable at the new position, and what the profile looks like at the level now selected.
     *
     * The preview is a query only - the level is written to the route's stored settings on Start
     * or Add Workout, never here, so comparing levels does not touch the user's settings file.
     */
    const applySettings = useCallback(async (settings: UIRouteSettings): Promise<RouteSettingsChangeResult> => {
        const prev = await refreshPrevRides(settings);
        const preview = card?.getSmoothingPreview(settings.smoothingLevel) ?? {};
        return { ...prev, ...preview };
    }, [card, refreshPrevRides]);

    useEffect(() => {
        if (!card || refInitialized.current) return;
        refInitialized.current = true;

        const currentProps = card.openSettings();
        setCardProps(currentProps);

        const data = card.getData();

        if (currentProps?.detailsAvailable === false) {
            setLoading(true);
            service.getRouteDetails(routeId)
                .then(() => {
                    if (!refMounted.current) return;
                    // Loading the details fills in distance, elevation and the video location, so
                    // everything read above is stale by now - read the settings again.
                    setCardProps(card.openSettings());
                    setLoading(false);
                })
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
                pct: Number.parseFloat(pct),
            })
        };
        const onDone = () => {
            setDownloadRow({ routeId, title, status: 'done' });
            refDownloadObserver.current = null;
            // The video has just landed on disk - cardProps (and the canStart it carries) was
            // captured at mount and is otherwise never refreshed, so re-read it now, the same way
            // it is re-read once the route details finish loading above.
            if (card) setCardProps(card.openSettings());
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
    }, [routeId, routeDescr, card]);

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
        // The video state changes on its own - a download progresses, iOS frees a file, the app
        // comes back to the foreground - so this dialog is told about its own route separately
        // from the page-wide update above. Other routes' updates are ignored.
        const refreshRoute = (updatedRouteId?: string) => {
            if (!updatedRouteId || updatedRouteId === routeId)
                refresh();
        };
        const observer = pageService.getPageObserver();

        observer?.on('page-update', refresh);
        observer?.on('route-details-update', refreshRoute);
        return () => {
            observer?.off('page-update', refresh);
            observer?.off('route-details-update', refreshRoute);
        };
    }, [pageService, routeId]);

    // A finished copy changes what the route is (a local file now) - read the card and the
    // availability again, and show the finished download.
    useEffect(() => {
        try {
            const prev = refCopyStatus.current;
            refCopyStatus.current = copyState.state.status;
            if (prev !== 'copying' || copyState.state.status !== 'idle' || !card) return;
            setCardProps(card.openSettings());
            setRouteDetailsProps(pageService.getRouteDetailsProps(routeId));
            setDownloadRow({ routeId, title: routeDescr?.title ?? '', status: 'done' });
        }
        catch (err: any) {
            logError(err, 'RouteDetailsDialog.copyFinished');
        }
    }, [copyState.state.status, card, pageService, routeId, routeDescr, logError]);

    const onClearWorkout = useCallback(() => {
        pageService.onClearWorkoutSelection();
    }, [pageService]);

    /**
     * Every video action is a straight hand-off to the page service, which owns the decision and
     * emits 'route-details-update' when it has taken effect. Nothing is applied optimistically
     * here: a local guess would be a second source of truth for the same state.
     */
    const videoActions = useMemo(() => ({
        onVideoDownloadPressed: () => pageService.onVideoDownloadPressed(routeId),
        onVideoDownloadConfirmed: (choice: VideoKeepChoice) => pageService.onVideoDownloadConfirmed(routeId, choice),
        onVideoDownloadDismissed: () => pageService.onVideoDownloadDismissed(routeId),
        onVideoRetry: () => pageService.onVideoRetry(routeId),
        onVideoStop: () => pageService.onVideoStop(routeId),
        onVideoKeepInstead: () => pageService.onVideoKeepInstead(routeId),
        onVideoRemovePressed: () => pageService.onVideoRemovePressed(routeId),
        onVideoRemoveConfirmed: () => pageService.onVideoRemoveConfirmed(routeId),
        onVideoRemoveDismissed: () => pageService.onVideoRemoveDismissed(routeId),
        // The only one that resolves later: it opens the iOS picker and settles when the user
        // has picked (or cancelled). The outcome arrives through the observer like everything
        // else, so there is nothing to do with the promise here but let a failure go to the log.
        onVideoConfirmAccess: () => {
            pageService.onConfirmAccess(routeId)
                ?.catch((err: Error) => logEvent({ message: 'error', fn: 'onConfirmAccess', error: err.message }));
        },
    }), [pageService, routeId, logEvent]);

    useUnmountEffect(() => {
        refMounted.current = false;
    });

    if (!card || !cardProps || !routeDescr) return null;

    const {
        totalDistance,
        totalElevation,
        showLoopOverwrite,
        showNextOverwrite,
        canStart: cardCanStart,
        updateStartPos,
        settings,
        smoothingAvailable,
        smoothingMaxLevel,
        smoothedPoints,
        smoothedElevation,
        smoothedGradient
    } = cardProps;

    const { hasVideo, hasGpx, isLoop, videoFormat, previewUrl, segments } = routeDescr;
    const points = route.details?.points ?? route.points;
    // The elevation graph draws from the whole route record, not just the point array. The
    // points can come from the description alone (details not loaded yet, or an older library
    // entry), so fill them in rather than leaving the graph with nothing to draw.
    const details: RouteApiDetail | undefined = route.details;
    const routeData: RouteApiDetail | undefined = points?.length
        ? {
            ...details,
            id: details?.id ?? routeDescr.id ?? '',
            title: details?.title ?? routeDescr.title ?? '',
            points,
        }
        : undefined;
    const routeType = `${hasVideo ? 'Video' : 'GPX'} - ${isLoop ? 'Loop' : 'Point to Point'}`;
    const isAvi = videoFormat?.toLowerCase() === 'avi';
    const copyRow = copyable ? getCopyRow(routeId, routeDescr.title ?? '', copyState.state) : null;
    const shownRow = copyable ? copyRow : downloadRow;
    const downloadStatus = shownRow?.status ?? 'none'
    // Nothing is startable on provisional settings - a GPX route has no points to ride yet, and
    // for a video route the location of the video is still unknown.
    const source: RouteSourceProps = {
        availability: routeDetailsProps.availability,
        sourceLabel: routeDetailsProps.sourceLabel,
        unavailableReason: routeDetailsProps.unavailableReason,
    };
    const canStart = !isAvi && (cardCanStart ?? true) && source.availability !== 'unavailable' && downloadStatus !== 'downloading' && !loading;
    const isOnline = onlineStatusMonitor.onlineStatus;
    const canNotStartReason = getCanNotStartReason({ canStart, isAvi, isOnline, source });

    const hasDownloadUrl = !!(routeDescr.downloadUrl || (routeDescr.videoUrl?.startsWith('https://')));
    const hasSharedCopy = !!routeDescr.linkShared && downloadStatus === 'done';
    const showDownloadButton = hasDownloadUrl || routeDescr.requiresDownload === true || copyable || hasSharedCopy;

    let downloadButtonLabel: string | undefined;
    let downloadButtonDisabled = false;

    if (copyable) {
        downloadButtonLabel = getCopyButtonLabel(copyState.state);
        downloadButtonDisabled = copyState.state.status === 'copying';
    } else if (showDownloadButton) {
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
        try {
            if (copyable) {
                if (downloadStatus !== 'downloading') copyState.copy();
                setShowDownloadModal(true);
                return;
            }
            if (downloadStatus === 'none' || downloadStatus === 'failed') {
                const observer = card.download();
                setDownloadRow({ routeId, title: routeDescr.title ?? '', status: 'downloading' });
                subscribeToObserver(observer);
            }
            setShowDownloadModal(true);
        }
        catch (err: any) {
            logError(err, 'RouteDetailsDialog.onDownloadPress');
        }
    }, [card, copyable, copyState, downloadStatus, routeId, routeDescr, subscribeToObserver, logError]);

    const onDownloadModalClose = useCallback(() => {
        setShowDownloadModal(false);
    }, []);

    const onDownloadStop = useCallback((id: string) => {
        try {
            if (copyable) {
                copyState.cancel();
                return;
            }
            const c = service.getCard(id)
            if (c) {
                c.stopDownload(true);
            }
        }
        catch (err: any) {
            logError(err, 'RouteDetailsDialog.onDownloadStop');
        }
    }, [service, copyable, copyState, logError]);

    const onDownloadRetry = useCallback((id: string) => {
        try {
            if (copyable) {
                copyState.copy();
                return;
            }
            const c = service.getCard(id);
            if (c) {
                const observer = c.download();
                setDownloadRow({ routeId, title: routeDescr.title ?? '', status: 'downloading' });
                subscribeToObserver(observer);
            }
        }
        catch (err: any) {
            logError(err, 'RouteDetailsDialog.onDownloadRetry');
        }
    }, [service, copyable, copyState, routeId, routeDescr, subscribeToObserver, logError]);

    // only the copy on this device goes; the route stays (it is still shared by the computer)
    const deleteSharedCopy = useCallback((id: string) => {
        try {
            pageService.deleteLocalCopy(id)
                ?.then(() => {
                    if (!refMounted.current) return;
                    setDownloadRow(null);
                    if (card) setCardProps(card.openSettings());
                    setRouteDetailsProps(pageService.getRouteDetailsProps(routeId));
                })
                .catch((err: Error) => logError(err, 'deleteLocalCopy'));
        }
        catch (err: any) {
            logError(err, 'deleteLocalCopy');
        }
    }, [pageService, card, routeId, logError]);

    const onDownloadDelete = useCallback((id: string) => {
        try {
            if (copyable) {
                copyState.clear();
                return;
            }
            if (routeDescr.linkShared) {
                deleteSharedCopy(id);
                return;
            }
            service.getCard(id)?.delete();
            setDownloadRow(null);
        }
        catch (err: any) {
            logError(err, 'RouteDetailsDialog.onDownloadDelete');
        }
    }, [service, copyable, copyState, routeDescr, deleteSharedCopy, logError]);

    const downloadRows: DownloadRowDisplayProps[] = shownRow ? [shownRow] : [];
    const copyFailureText = copyable ? getCopyFailureText(copyState.state) : undefined;
    const downloadButtonPrimary = routeDescr.requiresDownload === true;

    return (
        <RouteDetailsView
            title={routeDescr.title ?? ''}
            compact={compact}
            hasGpx={hasGpx ?? false}
            points={points}
            previewUrl={previewUrl}
            thumbnailLink={routeDetailsProps.thumbnailLink}
            availability={source.availability}
            sourceLabel={source.sourceLabel}
            unavailableReason={source.unavailableReason}
            routeData={routeData}
            isOnline={isOnline}
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
            showPrev={showPrev}
            loading={loading}
            initialSettings={settings as UIRouteSettings}
            prevRides={prevRides ?? undefined}
            attachedWorkout={routeDetailsProps.attachedWorkout}
            smoothingAvailable={smoothingAvailable}
            smoothingMaxLevel={smoothingMaxLevel}
            smoothedPoints={smoothedPoints}
            smoothedElevation={smoothedElevation}
            smoothedGradient={smoothedGradient}
            onStart={(updatedSettings) => {
                card.changeSettings(updatedSettings);
                card.start();
                onStart();
            }}
            onCancel={() => {
                card.cancel();
            }}
            onAddWorkout={(updatedSettings) => {
                card.changeSettings(updatedSettings);
                card.addWorkout();
                navigate('workouts');
            }}
            onClearWorkout={onClearWorkout}
            onSettingsChanged={applySettings}
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
            copyFailureText={copyFailureText}
            copySizeBytes={copyable ? copyState.sizeBytes : undefined}
            onDownloadStop={onDownloadStop}
            onDownloadRetry={onDownloadRetry}
            onDownloadDelete={onDownloadDelete}
            video={routeDetailsProps.video}
            deviceWord={deviceWord}
            {...videoActions}
        />
    );
};
