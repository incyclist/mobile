import React from 'react';
import { G } from 'react-native-svg';
import {
    GraphDomain,
    GraphMargins,
    ScaleConfig,
    GraphPoint,
    RiderMarker,
    AvatarConfig,
} from './types';
import { domainToPixel } from './utils';
import { AvatarMarker } from './AvatarMarker';

interface ElevationGraphMarkerProps {
    domain: GraphDomain;
    margins: GraphMargins;
    plotWidth: number;
    plotHeight: number;
    xScale?: ScaleConfig;
    graphPoints: GraphPoint[];
    markerPosition?: number; // Current user's position in raw meters
    currentAvatar?: AvatarConfig;
    markers?: RiderMarker[];
    lapMode?: boolean;
}

export const ElevationGraphMarker = ({
    domain,
    margins,
    plotWidth,
    plotHeight,
    xScale = { value: 1 / 1000, unit: 'km' },
    graphPoints,
    markerPosition,
    currentAvatar,
    markers,
    lapMode: _lapMode,
}: ElevationGraphMarkerProps) => {
    // Helper to get interpolated Y domain value at a given scaled X domain value
    const getElevationYDomainAtXDomain = (targetXDomain: number): number | null => {
        if (graphPoints.length === 0) {
            return null;
        }

        // Find the two graph points that bracket the targetXDomain
        let p1: GraphPoint | undefined;
        let p2: GraphPoint | undefined;

        for (let i = 0; i < graphPoints.length; i++) {
            if (graphPoints[i].x <= targetXDomain) {
                p1 = graphPoints[i];
            }
            if (graphPoints[i].x >= targetXDomain) {
                p2 = graphPoints[i];
                break;
            }
        }

        if (p1 && p1.x === targetXDomain) {
            return p1.y;
        }
        if (p2 && p2.x === targetXDomain) {
            return p2.y;
        }

        if (p1 && p2 && p1 !== p2) {
            const fraction = (targetXDomain - p1.x) / (p2.x - p1.x);
            return p1.y + fraction * (p2.y - p1.y);
        }

        // Handle edge cases: targetXDomain outside or only one point
        if (p1) return p1.y;
        if (p2) return p2.y;
        return domain.yMin; // Fallback to bottom of graph
    };

    interface ResolvedMarker {
        cx: number;
        cy: number;
        avatarConfig?: AvatarConfig;
        isCurrentUser?: boolean;
        position: number; // raw meter position for sorting
    }

    const resolvedMarkers: ResolvedMarker[] = [];

    // Process current user's marker
    if (markerPosition !== undefined && markerPosition !== null) {
        const xRaw = markerPosition;
        const xDomainScaled = xRaw * xScale.value;

        if (xDomainScaled >= domain.xMin && xDomainScaled <= domain.xMax) {
            const yDomain = getElevationYDomainAtXDomain(xDomainScaled);
            if (yDomain !== null) {
                const cx = margins.left + domainToPixel(xDomainScaled, domain.xMin, domain.xMax, 0, plotWidth);
                const cy = margins.top + domainToPixel(yDomain, domain.yMin, domain.yMax, plotHeight, 0);
                resolvedMarkers.push({
                    cx,
                    cy,
                    avatarConfig: currentAvatar,
                    isCurrentUser: true,
                    position: xRaw,
                });
            }
        }
    }

    // Process other riders' markers
    markers?.forEach((marker) => {
        const xRaw = marker.position;
        const xDomainScaled = xRaw * xScale.value;

        if (xDomainScaled >= domain.xMin && xDomainScaled <= domain.xMax) {
            const yDomain = getElevationYDomainAtXDomain(xDomainScaled);
            if (yDomain !== null) {
                const cx = margins.left + domainToPixel(xDomainScaled, domain.xMin, domain.xMax, 0, plotWidth);
                const cy = margins.top + domainToPixel(yDomain, domain.yMin, domain.yMax, plotHeight, 0);
                resolvedMarkers.push({
                    cx,
                    cy,
                    avatarConfig: marker.avatar,
                    isCurrentUser: marker.isCurrentUser,
                    position: xRaw,
                });
            }
        }
    });

    // Sort markers to ensure current user is rendered last (on top)
    resolvedMarkers.sort((a, b) => (a.isCurrentUser ? 1 : b.isCurrentUser ? -1 : 0));

    return (
        <G>
            {resolvedMarkers.map((marker, index) => (
                <AvatarMarker
                    key={`${marker.position}-${index}`} // Use position and index as key
                    cx={marker.cx}
                    cy={marker.cy}
                    avatar={marker.avatarConfig}
                    isCurrentUser={marker.isCurrentUser}
                />
            ))}
        </G>
    );
};
