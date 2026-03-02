import React, { useCallback, useEffect, useState } from 'react';
import { getRoutesPageService, RouteDetailUIItem, useRouteList } from 'incyclist-services';
import { RouteItemView } from './RouteItemView';
import { useLogging } from '../../hooks';
import { RouteItemDisplayProps } from './types';

// Module-level cache — survives FlashList recycling
const detailsCache = new Map<string, RouteDetailUIItem>();



export const RouteItem = (props: RouteItemDisplayProps) => {
    const { id, loaded, outsideFold } = props;
    
    const [details, setDetails] = useState<RouteDetailUIItem | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);
    
    const service = useRouteList();
    const page = getRoutesPageService()
    const { logError } = useLogging('RouteItem');

    // Re-sync from cache when id changes (FlashList recycling)
    useEffect(() => {
        if (!id) return;
        const cached = detailsCache.get(id);
        if (cached) {
            setDetails(cached);
        } else {
            setDetails(undefined);
        }
    }, [id]);

    useEffect(() => {
        // Guard: don't fetch if already have details, currently loading, props say it's loaded,
        // OR if it's currently outside the fold (and not in the lookahead range)
        if (details || isLoading || loaded || outsideFold) return;
        if (id && detailsCache.has(id)) return; 
        
        setIsLoading(true);
        service.getRouteDetails(id!)
            .then(routeDetails => {
                if (routeDetails) {
                    detailsCache.set(id!, routeDetails as RouteDetailUIItem);
                    setDetails(routeDetails as RouteDetailUIItem);
                }
            })
            .catch(err => {
                logError(err, 'getRouteDetails');
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [id, loaded, service, logError, isLoading, details, outsideFold]);


    const onSelect = useCallback( (routeId:string) => { page.onSelect(routeId)} ,[page])
    const onDelete = useCallback( (routeId:string) => { page.onDelete(routeId)} ,[page])

    const points = details?.points ?? props.points;
    const previewUrl = details?.previewUrl ?? props.previewUrl;
    
    const displayProps = {
        ...props,
        points,
        previewUrl,
        loaded: loaded || !!points || !!previewUrl,
        outsideFold,
    };

    return <RouteItemView {...displayProps} onSelect={onSelect} onDelete={onDelete} />;
};
