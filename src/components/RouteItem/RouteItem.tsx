import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { getRoutesPageService, RouteDetailUIItem, useRouteList } from 'incyclist-services';
import { RouteItemView } from './RouteItemView';
import { useLogging } from '../../hooks';
import { RouteItemDisplayProps } from './types';

// Module-level cache — survives FlashList recycling
const detailsCache = new Map<string, RouteDetailUIItem>();

// rows of computer routes that did not fetch their details (reported in batches, one event per row would flood the log)
const skippedRows = new Set<string>();
const SKIP_REPORT_EVERY = 25;



// memoised: a change in one route of a list of thousands must not render every row again - the page
// service keeps the identity of the fields of unchanged routes, so the shallow comparison holds
export const RouteItem = memo((props: RouteItemDisplayProps) => {
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
            setUpdated(update)
        })
    })

    // routes of a paired computer: the card needs the summary and the thumbnail only. Their details are a
    // descriptor of up to a megabyte over a slow link and load when the route is opened, started or copied.
    const sharedRow = (updated?.linkShared ?? props.linkShared) === true
    const thumbnailLink = updated?.thumbnailLink ?? props.thumbnailLink

    const cancelLoadRef = useRef<(() => void) | undefined>(undefined)
    // a request that has not run yet is dropped when the row is recycled or unmounted
    useEffect(() => () => {
        if (!cancelLoadRef.current) return;
        cancelLoadRef.current();
        cancelLoadRef.current = undefined;
        setIsLoading(false);
    }, [id]);

    useEffect(() => {
        // Guard: don't fetch if already have details, currently loading, props say it's loaded,
        // OR if it's currently outside the fold (and not in the lookahead range)
        if (details || isLoading || loaded || outsideFold) return;
        if (sharedRow) {
            if (id && !skippedRows.has(id)) {
                skippedRows.add(id);
                if (skippedRows.size % SKIP_REPORT_EVERY === 0)
                    logEvent({ message: 'route details fetch suppressed', reason: 'shared-row', suppressed: skippedRows.size });
            }
            return;
        }
        if (id && detailsCache.has(id)) return; 
        
        setIsLoading(true);
        try {
            cancelLoadRef.current = service.requestRouteDetails(id!, (routeDetails) => {
                cancelLoadRef.current = undefined;
                if (routeDetails) {
                    detailsCache.set(id!, routeDetails as RouteDetailUIItem);
                    setDetails(routeDetails as RouteDetailUIItem);
                }
                setIsLoading(false);
            });
        }
        catch (err: any) {
            logError(err, 'requestRouteDetails');
            setIsLoading(false);
        }
    }, [id, loaded, service, logError, logEvent, isLoading, details, outsideFold, sharedRow]);

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

    const onDeleteLocalCopy = useCallback( (routeId:string) => {
        try {
            logEvent({message:'local copy deleted', id, title, eventSource:'user' })
            page.deleteLocalCopy(routeId)?.catch( (err:Error) => logError(err,'deleteLocalCopy'))
        }
        catch (err:any) {
            logError(err,'deleteLocalCopy')
        }
    } ,[logEvent, logError, id, title, page])

    const points = details?.points ?? props.points;
    const previewUrl = details?.previewUrl ?? props.previewUrl;
    
    const displayProps = updated? 
    {
        ...updated,
        // where the route plays from is computed by the page service; the card carries the latest
        // value (pushed through its own observer when a computer comes or goes), the list props
        // are the fallback until it has one
        ...(updated.availability === undefined ? {
            availability: props.availability,
            sourceLabel: props.sourceLabel,
            unavailableReason: props.unavailableReason,
            thumbnailLink: props.thumbnailLink,
        } : {}),
        linkShared: updated.linkShared ?? props.linkShared,
        points: updated.points??details?.points??props.points,
        loaded: loaded || !!points || !!previewUrl || !!thumbnailLink,
        outsideFold,
    }
    :
    {
        ...props,
        points,
        previewUrl,
        loaded: loaded || !!points || !!previewUrl || !!thumbnailLink,
        outsideFold,
    };

    if(deleted)
        return null;

    return <RouteItemView {...displayProps} onSelect={onSelect} onDelete={onDelete} onDeleteLocalCopy={onDeleteLocalCopy} />;
});
