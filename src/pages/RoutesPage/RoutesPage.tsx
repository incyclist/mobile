import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import {
    getRoutesPageService,
    RoutePageDisplayProps,
    IObserver,
    SearchFilter,
    RouteItemProps
} from 'incyclist-services';
import { useLogging, useUnmountEffect, useScreenLayout } from '../../hooks';
import { useScheduledWorkoutPrompt } from '../../hooks/workouts';
import { RoutesPageView } from './View';
import { ErrorBoundary, MainBackground, RouteDetailsDialog, RouteImportDialog, ScheduledWorkoutPromptModal } from '../../components';
import { navigate } from '../../services';


const PageView = memo(RoutesPageView)
const DetailsDialog = memo(RouteDetailsDialog)
const ImportDialog = memo(RouteImportDialog)

const initialProps: RoutePageDisplayProps = {
    loading: true,
    synchronizing: false,
    routes: [],
    filters: {},
    filterOptions: {
        countries: [],
        contentTypes: [],
        routeTypes: [],
        routeSources: [],
    },
    detailRouteId: undefined,
    filterVisible: false,
};

// Stabilizes the routes array reference across page-update events that don't actually change
// anything visible, so downstream memoized rows aren't recreated needlessly. The hash has to
// include every field a row can gain or lose without the set of ids changing - a route's own
// id never changes when e.g. its video pill or preview arrives asynchronously after the initial
// render, and an id-only hash would then never refresh that route's props at all.
const hashRoutes = (routes: RouteItemProps[]) =>
    routes.map(r => `${r.id}:${r.videoPill ?? ''}:${r.previewUrl ?? ''}:${r.cntActive ?? 0}:${r.isNew ? 1 : 0}:${r.loaded ? 1 : 0}`).join(',')


export const RoutesPage = () => {
    const service = getRoutesPageService();
    const { prompt: scheduledWorkoutPrompt, onYes: onScheduledWorkoutYes, onNo: onScheduledWorkoutNo, onCheckWorkouts: onScheduledWorkoutCheck } = useScheduledWorkoutPrompt();

    const compact = useScreenLayout() === 'compact';

    const [props, setProps] = useState<RoutePageDisplayProps>(initialProps);
    const [showImportDialog, setShowImportDialog] = useState(false);
    const [showDownloadModal, setShowDownloadModal] = useState(false);

    const refObserver = useRef<IObserver | null>(null);
    const refRoutes = useRef<RouteItemProps[]>([])
    const refRoutesHash = useRef<string>('')
    const refFilterOptions = useRef(props.filterOptions)

    const { logError,logEvent } = useLogging('RoutesPage');



    const onUpdate = useCallback(() => {
        const updated = service.getPageDisplayProps();
        if (!updated) return;

        // Stabilize routes reference using ID hash
        const newHash = hashRoutes(updated.routes ?? [])
        const hashChanged = newHash !== refRoutesHash.current
        if (hashChanged) {
            refRoutesHash.current = newHash
            refRoutes.current = updated.routes ?? []
        }

        // Stabilize filterOptions reference
        if (JSON.stringify(updated.filterOptions) !== 
            JSON.stringify(refFilterOptions.current)) {
            refFilterOptions.current = updated.filterOptions
        }

        setProps({
            ...updated,
            routes: refRoutes.current,
            filterOptions: refFilterOptions.current,
        });

    }, [service]);

    const onImportClose = useCallback(() => {
        setShowImportDialog(false)
    }, []);

    useEffect(() => {
        if (!service || refObserver.current) return;

        try {
            refObserver.current = service.openPage();
            if (refObserver.current) {
                refObserver.current
                    .on('page-update', onUpdate)
            }
            onUpdate();
        } catch (err: any) {
            logError(err, 'init');
        }
    }, [service, logError, onUpdate]);

    useUnmountEffect(() => {
        // diagnostic context for unexplained unmounts (e.g. while a native picker has focus) —
        // see the 'onImportClosed'/'importSingle' crash pattern this is meant to help diagnose
        logEvent({ message: 'RoutesPage unmounting', showImportDialog, appState: AppState.currentState });

        service.closePage();
        if (refObserver.current) {
            refObserver.current?.stop()
            refObserver.current = null
        }

    });

    const setFilterVisible = useCallback( (visible:boolean) => {
        setProps( (current)=>({...current,filterVisible:visible}))
    },[])

    const onFilterChanged = useCallback((filters: SearchFilter) => {
        service.onFilterChanged(filters);
    },[service])

    const onStartRoute = useCallback( ()=> {
        service.start()
    },[service])

    const onFilterToggle = useCallback( () => {
        const visible = !props.filterVisible
        setFilterVisible(visible);
        service.onFilterVisibleChange(visible)
        
    },[props.filterVisible, service, setFilterVisible])

    const onImportClicked = useCallback(() => {
        service.onImportClicked();
        setShowImportDialog(true)
    }, [service]);


    const onDownloadPillPress = useCallback(() => {
        setShowDownloadModal(true);
    }, []);

    const onDownloadModalClose = useCallback(() => {
        setShowDownloadModal(false);
    }, []);

    const onDownloadStop = useCallback((routeId: string) => {
        service.onDownloadStop(routeId);
    }, [service]);

    const onDownloadRetry = useCallback((routeId: string) => {
        service.onDownloadRetry(routeId);
    }, [service]);

    const onDownloadDelete = useCallback((routeId: string) => {
        service.onDownloadDelete(routeId);
    }, [service]);

    const onDownloadKeepInstead = useCallback((routeId: string) => {
        service.onDownloadKeepInstead(routeId);
    }, [service]);

    const onNavigate= useCallback( (page:string)=> {
        navigate(page)
    },[])

    if (!refObserver.current) {
        return <MainBackground />;
    }

    return (
        <ErrorBoundary>
            <PageView
                loading={props.loading}
                synchronizing={props.synchronizing ?? false}
                routes={(props.routes as RouteItemProps[]) ?? []}
                filters={props.filters}
                filterOptions={props.filterOptions!}
                filterVisible={props.filterVisible}            
                onFilterChanged={onFilterChanged}
                onFilterToggle={onFilterToggle}
                onImportClicked={onImportClicked}
                onNavigate={onNavigate}
                compact={compact}
                showImportDialog={showImportDialog}
                onImportClose={onImportClose}
                downloadObserver={props.downloadObserver}
                showDownloadModal={showDownloadModal}
                onDownloadPillPress={onDownloadPillPress}
                onDownloadModalClose={onDownloadModalClose}
                onDownloadStop={onDownloadStop}
                onDownloadRetry={onDownloadRetry}
                onDownloadDelete={onDownloadDelete}
                onDownloadKeepInstead={onDownloadKeepInstead}
            />
            {props.detailRouteId && (
                <DetailsDialog routeId={props.detailRouteId} onStart={onStartRoute} />
            )}
            {showImportDialog && (
                <ImportDialog onClose={onImportClose} />
            )}
            {scheduledWorkoutPrompt && (
                <ScheduledWorkoutPromptModal
                    visible
                    title={scheduledWorkoutPrompt.title}
                    onYes={onScheduledWorkoutYes}
                    onNo={onScheduledWorkoutNo}
                    onCheckWorkouts={onScheduledWorkoutCheck}
                />
            )}
        </ErrorBoundary>
    );
};