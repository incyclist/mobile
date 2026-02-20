import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { MainBackground } from '../../components';

const initialProps: RoutePageDisplayProps = {
    loading: true,
    synchronizing: false,
    routes: [],
    filterOptions: {
        countries: [],
        contentTypes: [],
        routeTypes: [],
        routeSources: [],
    },
};

export const RoutesPage = () => {
    const service = getRoutesPageService();
    const { height } = useWindowDimensions();
    const compact = height < 420;

    const [props, setProps] = useState<RoutePageDisplayProps>(initialProps);
    const [filterVisible, setFilterVisible] = useState(!compact);
    const [currentFilters, setCurrentFilters] = useState<SearchFilter>({});
    
    const refObserver = useRef<IObserver | null>(null);
    const { logError } = useLogging('RoutesPage');

    const onUpdate = useCallback(() => {
        const updated = service.getPageDisplayProps();
        if (updated) {
            setProps(updated);
        }
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
    });

    const onFilterChanged = (filters: SearchFilter) => {
        setCurrentFilters(filters);
        service.onFilterChanged(filters);
    };

    const onFilterToggle = () => {
        setFilterVisible(!filterVisible);
    };

    const onImportClicked = () => {
        service.onImportClicked();
    };

    if (!refObserver.current) {
        return <MainBackground />;
    }

    return (
        <RoutesPageView
            loading={props.loading}
            synchronizing={props.synchronizing ?? false}
            routes={(props.routes as RouteItemProps[]) ?? []}
            filters={currentFilters}
            filterOptions={props.filterOptions!}
            filterVisible={filterVisible}
            onFilterChanged={onFilterChanged}
            onFilterToggle={onFilterToggle}
            onImportClicked={onImportClicked}
            compact={compact}
        />
    );
};