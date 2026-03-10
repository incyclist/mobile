import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { useRouteList, useActivityList } from 'incyclist-services';
import type { UIRouteSettings, UIStartSettings } from 'incyclist-services';
import { useLogging, useUnmountEffect } from '../../hooks';
import { RouteDetailsView } from './RouteDetailsView';
import { RouteDetailsDialogProps } from './types';

export const RouteDetailsDialog = ({ routeId,onStart }:RouteDetailsDialogProps ) => {
    const { height } = useWindowDimensions();
    const compact = height < 420;
    
    const service = useRouteList();
    const activities = useActivityList();
    const card = service.getCard(routeId);
    
    const { logEvent } = useLogging('RouteDetailsDialog');
    const refMounted = useRef(true);
    const refInitialized = useRef(false)
    
    const [cardProps, setCardProps] = useState(() => card?.openSettings());
    const [loading, setLoading] = useState(false);
    const [prevRides, setPrevRides] = useState<any[] | null>(null);
    const [showPrev, setShowPrev] = useState(false);

    const refreshPrevRides = useCallback(async (settings: UIRouteSettings) => {
        if (!card) return { prevRides: undefined, showPrev: false };
        const route = card.getData();
        const routeHash = route.description.routeHash;
        const rId = !routeHash ? route.description.id : undefined;
        
        const prev = await activities.getPastActivitiesWithDetails({
            routeHash,
            routeId: rId,
            startPos: settings.startPos?.value,
            endPos: settings.endPos?.value,
            realityFactor: settings.realityFactor
        });

        if (!refMounted.current) return { prevRides: undefined, showPrev: false };
        
        const hasPrev = prev?.length > 0;
        setPrevRides(hasPrev ? prev : null);
        setShowPrev(hasPrev);
        return { prevRides: hasPrev ? prev : undefined, showPrev: hasPrev };
    }, [card, activities]);

    useEffect(() => {
        if (!card || refInitialized.current) return;
        refInitialized.current = true;
        
        const currentProps = card.openSettings();
        setCardProps(currentProps);
        
        const route = card.getData();
        
        if (!route.details) {
            setLoading(true);
            service.getRouteDetails(routeId)
                .then(() => { if (refMounted.current) setLoading(false); })
                .catch(() => { if (refMounted.current) setLoading(false); });
        }

        refreshPrevRides(currentProps.settings as UIRouteSettings);
        logEvent({ message: 'dialog shown', title:'select route',route: route.description.title });
    }, [routeId, card, service, refreshPrevRides, logEvent]);

    useUnmountEffect(() => {
        refMounted.current = false;
    });

    if (!card || !cardProps) return null;

    const { 
        totalDistance, 
        totalElevation, 
        showLoopOverwrite, 
        showNextOverwrite, 
        hasWorkout, 
        canStart: cardCanStart, 
        updateStartPos, 
        settings 
    } = cardProps;

    const route = card.getData();
    const routeDescr = route.description;
    const { hasVideo, hasGpx, isLoop, videoFormat, previewUrl, segments } = routeDescr;
    const points = route.details?.points ?? route.points;
    const routeType = `${hasVideo ? 'Video' : 'GPX'} - ${isLoop ? 'Loop' : 'Point to Point'}`;
    const isAvi = videoFormat?.toLowerCase() === 'avi';
    const canStart = !isAvi && (cardCanStart ?? true);
    const canNotStartReason = isAvi ? 'AVI videos are not supported on mobile' : undefined;

    return (
        <RouteDetailsView
            title={routeDescr.title ?? ''}
            compact={compact}
            hasGpx={hasGpx ?? false}
            points={points}
            previewUrl={previewUrl}
            totalDistance={totalDistance}
            totalElevation={totalElevation}
            routeType={routeType}
            videoFormat={videoFormat}
            segments={segments}
            canStart={canStart}
            canNotStartReason={canNotStartReason}
            showLoopOverwrite={!!showLoopOverwrite}
            showNextOverwrite={!!showNextOverwrite}
            showWorkout={!hasWorkout}
            showPrev={showPrev}
            loading={loading}
            initialSettings={settings as UIRouteSettings}
            prevRides={prevRides ?? undefined}
            onStart={(updatedSettings) => {
                logEvent({ message: 'button clicked', button: 'start', eventSource: 'user' });
                card.changeSettings(updatedSettings);
                card.start();
                onStart()
            }}
            onCancel={() => {
                logEvent({ message: 'button clicked', button: 'cancel', eventSource: 'user' });
                card.cancel();
            }}
            onStartWithWorkout={(updatedSettings) => {
                logEvent({ message: 'button clicked', button: 'start-with-workout', eventSource: 'user' });
                card.changeSettings(updatedSettings);
                card.addWorkout();
            }}
            onSettingsChanged={refreshPrevRides}
            onUpdateStartPos={(value) => {
                if (!updateStartPos) return null;
                const result = updateStartPos(value);
                if (!result) return null;
                return {
                    ...(cardProps.settings as UIStartSettings),
                    startPos: result
                };
            }}
        />
    );
};
