import React, { useEffect, useState } from 'react';
import { RouteDetailUIItem, RouteItemProps, useRouteList } from 'incyclist-services';
import { RouteItemView } from './RouteItemView';
import { useLogging } from '../../hooks';

export const RouteItem = (props: RouteItemProps) => {
    const { id, loaded /*, outsideFold*/ } = props;
    const [details, setDetails] = useState<Partial<RouteDetailUIItem>>({});
    const [isLoading, setIsLoading] = useState(false);
    
    const service = useRouteList();
    const { logError } = useLogging('RouteItem');

    useEffect(() => {
        // Only fetch if not loaded, not already fetching, and not hidden by fold
        if (!loaded && !isLoading /*&& !outsideFold*/) {
            setIsLoading(true);
            service.getRouteDetails(id!)
                .then(routeDetails => {
                    setDetails( routeDetails);
                })
                .catch(err => {
                    logError(err, 'getRouteDetails');
                })
                .finally(() => {
                    setIsLoading(false);
                });
        }
    }, [id, loaded, service, logError, isLoading]);

    const {points} = details
    // Merge original props with fetched details
    const displayProps = {
        ...props,
        points,
        loaded: loaded || !!details.points || !!details.previewUrl,
        
    };

    return <RouteItemView {...displayProps} />;
};