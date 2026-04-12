import { RoutePoint } from 'incyclist-services';
import { ReactNode } from 'react';
import { StyleProp, ViewStyle } from 'react-native';

// Business Logic Type
export interface LatLng {
    lat: number;
    lng: number;
}

export interface IncyclistNode extends LatLng {
    id?: string;
    ways?: Array<string>;
    tags?: Record<string, string>;
    wayId?: string;
    routeDistance?: number;
}

export interface TBoundary {
    southwest: LatLng;
    northeast: LatLng;
}

export interface TWay {
    id: string;
    path: Array<IncyclistNode>;
    selected?: boolean;
    color?: string;
}

export interface TOption extends TWay {
    options?: Array<TOption>;
}

export interface TViewPort {
    center: LatLng;
    zoom: number;
}

export interface TFreeMapProps {
    position?: LatLng|RoutePoint;
    viewport?: TViewPort;
    routeOptions?: Array<TOption>;
    startPos?: number;
    endPos?: number;
    points?: Array<IncyclistNode>;
    route?: any; 
    activity?: any;
    center?: LatLng;
    draggable?: boolean;
    noAttribution?: boolean;
    viewportOverwrite?: boolean;
    bounds?: TBoundary;
    scrollWheelZoom?: boolean;
    zoomControl?: boolean;
    attributionControl?: boolean;
    zoom?: number;
    width?: number | string;
    height?: number | string;
    style?: StyleProp<ViewStyle>;
    onPositionChanged?: (position: LatLng) => void;
    onRoutePositionChanged?: (distanceMeters: number) => void;
    onViewportChanged?: (viewport: TViewPort) => void;
    children?: ReactNode;
    colorActive?: string;
    colorInactive?: string;
    colorDone?:string;
    followPosition?: boolean;
    showDone?: boolean
}

// Internal type for MapLibre which uses [longitude, latitude]
export type MapCoord = [number, number];

export interface FreeMapViewProps extends TFreeMapProps {
    cameraProps: {
        centerCoordinate?: MapCoord;
        zoomLevel?: number;
        bounds?: {
            ne: MapCoord;
            sw: MapCoord;
            paddingLeft?: number;
            paddingRight?: number;
            paddingTop?: number;
            paddingBottom?: number;
        };
    };
    polylineData: GeoJSON.FeatureCollection<GeoJSON.LineString>;
    markerCoordinate?: MapCoord;
    followPosition?: boolean;
}