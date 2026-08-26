import React, { memo, useCallback, useState, useEffect, useRef } from 'react';
import { formatDateTime, useActivityList, ActivityDetails, useUserSettings  } from 'incyclist-services';
import { ActivityListItemProps } from './types';
import { ActivityListItemView } from './ActivityListItemView';
import { isFormattedNumber } from '../../utils/formattedNumber';
import { useLogging } from '../../hooks';

const detailsCache = new Map<string, ActivityDetails>();

export const ActivityListItem = memo((props: ActivityListItemProps) => {
    const { activityInfo, onPress, onDelete, outsideFold = false } = props;
    const { summary, details: initialDetails } = activityInfo;
    const { id, startTime, rideTime, distance } = summary;

    const service = useActivityList();
    const userSettings = useUserSettings();
    const ftp = Number(userSettings.getValue('user.ftp', 200));

    const [details, setDetails] = useState<ActivityDetails | undefined>(undefined);
    const refInitialized = useRef(false);
    const { logEvent } = useLogging('ActivityItem');
    

    // Sync from cache on ID change (FlashList recycling)
    useEffect(() => {
        if (!id) return;
        const cached = detailsCache.get(id);
        if (cached) {
            setDetails(cached);
        } else {
            setDetails(undefined);
        }
    }, [id, initialDetails]);

    useEffect(() => {
        if (outsideFold) return;
        if (refInitialized.current) return;
        refInitialized.current = true;
        if (!id) return;
        const cached = detailsCache.get(id);
        if (cached) {
            setDetails(cached);
            return;
        }
        const observer = service.getActivityDetails(id);
        const onLoaded = (data: ActivityDetails) => {
            detailsCache.set(id, data);
            setDetails(data);
            observer.stop();
        };
        observer.once('loaded', onLoaded);
        return () => { observer.stop(); };
    }, [id, service, outsideFold]);



    // Data processing
    const displayTitle =
        summary.title === 'Incyclist Ride'
            ? details?.route?.title ?? details?.route?.name ?? 'Incyclist Ride'
            : summary.title;

    const handlePress = useCallback(() => {
        logEvent({message:'item selected', id, title:displayTitle, eventSource:'user' })
        onPress(id);
    }, [logEvent, id, displayTitle, onPress]);

    const handleDelete = useCallback(() => {
        logEvent({message:'item deleted', id, title:displayTitle, eventSource:'user' })
        onDelete(id);
    }, [logEvent, id, displayTitle, onDelete]);

    const dateStr = formatDateTime(new Date(startTime), '%d.%m.%Y');
    const timeStr = formatDateTime(new Date(startTime), '%H:%M');

    const hours = Math.floor(rideTime / 3600);
    const minutes = Math.floor((rideTime % 3600) / 60);
    const durationStr = hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;

    let distanceValue = '';
    let distanceUnit = '';
    if (isFormattedNumber(distance)) {
        distanceValue = distance.value.toFixed(1);
        distanceUnit = distance.unit;
    } else if (typeof distance === 'number') {
        distanceValue = (distance / 1000).toFixed(1);
        distanceUnit = 'km';
    }

    const elevation = (summary as any).totalElevation;
    let elevationValue = '';
    let elevationUnit = '';
    if (isFormattedNumber(elevation)) {
        elevationValue = Math.round(elevation.value).toString();
        elevationUnit = elevation.unit;
    } else if (typeof elevation === 'number' && !Number.isNaN(elevation)) {
        elevationValue = Math.round(elevation).toString();
        elevationUnit = 'm';
    }

    return (
        <ActivityListItemView
            title={displayTitle}
            dateStr={dateStr}
            timeStr={timeStr}
            durationStr={durationStr}
            distanceValue={distanceValue}
            distanceUnit={distanceUnit}
            elevationValue={elevationValue}
            elevationUnit={elevationUnit}
            ftp={ftp}
            details={details}
            compact={false}
            outsideFold={outsideFold}
            onPress={handlePress}
            onDelete={handleDelete}
        />
    );
});

ActivityListItem.displayName = 'ActivityListItem';