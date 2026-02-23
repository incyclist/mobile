import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { 
    getRoutesPageService, 
    RoutePageDisplayProps, 
    IObserver, 
    SearchFilter,
    RouteItemProps
} from 'incyclist-services';
import { useLogging, useUnmountEffect } from '../../hooks';
import { RoutesPageView } from './View';
import { MainBackground,RouteDetailsDialog } from '../../components';
import { navigate } from '../../services';


const PageView = memo(RoutesPageView)
const Dialog = memo(RouteDetailsDialog)

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

const hashRoutes = (routes: RouteItemProps[]) =>
    routes.map(r => r.id).join(',')


export const RoutesPage = () => {
    const service = getRoutesPageService();

    const { height } = useWindowDimensions();
    const compact = height < 420;

    const [props, setProps] = useState<RoutePageDisplayProps>(initialProps);
    

    const refObserver = useRef<IObserver | null>(null);
    const refRoutes = useRef<RouteItemProps[]>([])
    const refRoutesHash = useRef<string>('')
    const refFilterOptions = useRef(props.filterOptions)

    const { logError } = useLogging('RoutesPage');



    const onUpdate = useCallback(() => {
        const updated = service.getPageDisplayProps();
        if (!updated) return;

        // Stabilize routes reference using ID hash
        const newHash = hashRoutes(updated.routes ?? [])
        if (newHash !== refRoutesHash.current) {
            refRoutesHash.current = newHash
            refRoutes.current = updated.routes ?? []
        }

        // Stabilize filterOptions reference
        if (JSON.stringify(updated.filterOptions) !== 
            JSON.stringify(refFilterOptions.current)) {
            refFilterOptions.current = updated.filterOptions
        }

        // Spread updated props but replace routes and filterOptions
        // with stabilized refs
        setProps({
            ...updated,
            routes: refRoutes.current,
            filterOptions: refFilterOptions.current,
        });
    }, [service]);

    useEffect(() => {
        if (!service || refObserver.current) return;

        try {
            refObserver.current = service.openPage();
            if (refObserver.current) {
                refObserver.current.on('page-update', onUpdate);
            }
            onUpdate();
        } catch (err: any) {
            logError(err, 'init');
        }
    }, [service, logError, onUpdate]);

    useUnmountEffect(() => {
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

    const onFilterToggle = useCallback( () => {
        const visible = !props.filterVisible
        setFilterVisible(visible);
        service.onFilterVisibleChange(visible) // inform service ( to save state -- does not cause page refresh)
        
    },[props.filterVisible, service, setFilterVisible])

    const onImportClicked = useCallback (() => {
        service.onImportClicked();
    },[service]);

    const onNavigate= useCallback( (page:string)=> {
        navigate(page)
    },[])

    if (!refObserver.current) {
        return <MainBackground />;
    }

    return (
        <>
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
        />
        {props.detailRouteId && (
            <Dialog routeId={props.detailRouteId} />
        )}
        </>
    );
};