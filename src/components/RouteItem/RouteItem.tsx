import React, { useCallback, useEffect, useRef, useState } from 'react';
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
    const [deleted,setDeleted] = useState(false)
    const [updated,setUpdated] = useState<RouteItemDisplayProps|null>(null)
    const service = useRouteList();
    const page = getRoutesPageService()
    const { logError,logEvent } = useLogging('RouteItem');

    const refInitialized = useRef(false)
    

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

    useEffect( ()=>{
        if (refInitialized.current)
            return;
        refInitialized.current = true
        props.observer?.on('update',(update:RouteItemDisplayProps) =>{
            const {id,title,videoPill} = update
            setUpdated(update)
            logEvent({message:'[DEBUG-ICLD] update event received',id,title,videoPill })
        })
    })

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

    const title = props?.title
    const onSelect = useCallback( (routeId:string) => { 
        logEvent({message:'item selected', id, title, eventSource:'user' })        
        page.onSelect(routeId)
    } ,[logEvent, id,title, page])


    const onDelete = useCallback( (routeId:string) => { 
        logEvent({message:'item deleted', id, title, eventSource:'user' })        
        page.onDelete(routeId)
        setDeleted(true)
    } ,[logEvent, id, title, page])

    const points = details?.points ?? props.points;
    const previewUrl = details?.previewUrl ?? props.previewUrl;
    
    const displayProps = updated? 
    {
        ...updated,
        points: updated.points??details?.points??props.points,
        loaded: loaded || !!points || !!previewUrl,
        outsideFold,
    }
    :
    {
        ...props,
        points,
        previewUrl,
        loaded: loaded || !!points || !!previewUrl,
        outsideFold,
    };

    if(deleted)
        return null;

    return <RouteItemView {...displayProps} onSelect={onSelect} onDelete={onDelete} />;
};
