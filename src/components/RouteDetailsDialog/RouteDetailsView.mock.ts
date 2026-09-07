import type { RouteApiDetail } from 'incyclist-services';
import type { RoutePoint } from './types';

/**
 * A short climb - enough points, and enough elevation spread, for the profile to be a real
 * curve rather than a flat line.
 */
export const MOCK_ROUTE_POINTS: RoutePoint[] = [
    { lat: 51.90, lng: 4.50, routeDistance: 0, elevation: 12 },
    { lat: 51.91, lng: 4.51, routeDistance: 500, elevation: 34 },
    { lat: 51.92, lng: 4.52, routeDistance: 1000, elevation: 78 },
    { lat: 51.93, lng: 4.53, routeDistance: 1500, elevation: 121 },
    { lat: 51.94, lng: 4.54, routeDistance: 2000, elevation: 96 },
    { lat: 51.95, lng: 4.55, routeDistance: 2500, elevation: 143 },
];

export const MOCK_ROUTE_DATA: RouteApiDetail = {
    id: 'r1',
    title: 'Col de Pennes',
    distance: 2500,
    elevation: 131,
    points: MOCK_ROUTE_POINTS,
};

/**
 * The same climb with its gradient changes softened - same point count, same distances, only the
 * elevations differ, which is what the transform guarantees.
 */
export const MOCK_SMOOTHED_POINTS: RoutePoint[] = [
    { lat: 51.90, lng: 4.50, routeDistance: 0, elevation: 12 },
    { lat: 51.91, lng: 4.51, routeDistance: 500, elevation: 41 },
    { lat: 51.92, lng: 4.52, routeDistance: 1000, elevation: 77 },
    { lat: 51.93, lng: 4.53, routeDistance: 1500, elevation: 108 },
    { lat: 51.94, lng: 4.54, routeDistance: 2000, elevation: 112 },
    { lat: 51.95, lng: 4.55, routeDistance: 2500, elevation: 137 },
];

/** what MOCK_SMOOTHED_POINTS add up to, against a route figure of 800 m */
export const MOCK_SMOOTHED_ELEVATION = { value: 760, unit: 'm' };
