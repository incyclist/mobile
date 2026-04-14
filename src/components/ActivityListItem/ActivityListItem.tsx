import React, { memo, useCallback, useState, useEffect, useRef } from 'react';
import { formatDateTime, useActivityList, ActivityDetails, useUserSettings  } from 'incyclist-services';
import { ActivityListItemProps } from './types';
import { ActivityListItemView } from './ActivityListItemView';

const detailsCache = new Map<string, ActivityDetails>();

export const ActivityListItem = memo((props: ActivityListItemProps) => {
    const { activityInfo, onPress, outsideFold = false } = props;
    const { summary, details: initialDetails } = activityInfo;
    const { id, startTime, rideTime, distance } = summary;

    const service = useActivityList();
    const userSettings = useUserSettings();
    const ftp = Number(userSettings.getValue('user.ftp', 200));

    const [details, setDetails] = useState<ActivityDetails | undefined>(undefined);
    const refInitialized = useRef(false);

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


    const handlePress = useCallback(() => {
        onPress(id);
    }, [id, onPress]);

    // Data processing
    const displayTitle =
        summary.title === 'Incyclist Ride'
            ? details?.route?.title ?? details?.route?.name ?? 'Incyclist Ride'
            : summary.title;

    const dateStr = formatDateTime(new Date(startTime), '%d.%m.%Y');
    const timeStr = formatDateTime(new Date(startTime), '%H:%M');

    const hours = Math.floor(rideTime / 3600);
    const minutes = Math.floor((rideTime % 3600) / 60);
    const durationStr = hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;

    let distanceValue = '';
    let distanceUnit = '';
    if (typeof distance === 'object' && distance !== null && 'value' in distance && 'unit' in distance) {
        distanceValue = distance.value.toFixed(1);
        distanceUnit = distance.unit;
    } else if (typeof distance === 'number') {
        distanceValue = (distance / 1000).toFixed(1);
        distanceUnit = 'km';
    }

    const elevation = (summary as any).totalElevation;
    let elevationValue = '';
    let elevationUnit = '';
    if (typeof elevation === 'object' && elevation !== null && 'value' in elevation && 'unit' in elevation) {
        elevationValue = Math.round(elevation.value).toString();
        elevationUnit = elevation.unit;
    } else if (typeof elevation === 'number' && !isNaN(elevation)) {
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
        />
    );
});

ActivityListItem.displayName = 'ActivityListItem';