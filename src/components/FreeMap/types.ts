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

// Shirt/helmet/skin etc. color parameterization for the avatar SVG marker.
// Mirrors the shape of `AvatarConfig` in `src/components/ElevationGraph/types.ts` (kept as a
// separate, locally-defined type here rather than imported, to avoid a cross-feature dependency
// between FreeMap and ElevationGraph — both draw from the same underlying asset,
// `src/assets/avatars/male-paths.ts`). Any field left undefined falls back to
// `AVATAR_DEFAULT_COLORS` from that asset.
export interface AvatarConfig {
    shirt?: string;
    helmOuter?: string;
    face?: string;
    shirtCuff?: string;
    skin?: string;
    glassesFrame?: string;
    shirtStripe?: string;
    helmInner?: string;
    skinShadow?: string;
    glassesInner?: string;
    hair?: string;
    helmet?: string; // override for the helmet color specifically (falls back to helmOuter)
}

// A previous rider's live position + identity, rendered as a marker alongside the current
// rider's own (unchanged) position marker. `key` must be stable across ticks for a given rider
// (e.g. the rider's `tsStart`) — it's used both as the React list key and, were positions to be
// re-computed on every tick, as the basis for a forced remount so the marker's map annotation is
// re-captured cleanly (matching the existing single-marker `key={marker-${coord}}` pattern).
export interface PrevRiderMarker {
    key: string;
    position: LatLng | RoutePoint;
    avatar?: AvatarConfig;
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
    // Previous riders' live positions (Race Against Yourself). Rendered alongside — never instead
    // of — the current rider's own marker, which is unaffected by this prop.
    prevRiders?: Array<PrevRiderMarker>;
}

// Internal type for MapLibre which uses [longitude, latitude]
export type MapCoord = [number, number];

// Internal type for MapLibre v11's Camera `bounds` prop: [west, south, east, north]
export type MapBounds = [number, number, number, number];

// A previous-rider marker resolved down to a plain map coordinate, as computed by `FreeMap.tsx`
// and consumed by the platform-specific view implementations.
export interface PrevRiderMapMarker {
    key: string;
    coordinate: MapCoord;
    avatar?: AvatarConfig;
}

export interface FreeMapViewProps extends TFreeMapProps {
    cameraProps: {
        center?: MapCoord;
        zoom?: number;
        bounds?: MapBounds;
        padding?: {
            top?: number;
            right?: number;
            bottom?: number;
            left?: number;
        };
    };
    polylineData: GeoJSON.FeatureCollection<GeoJSON.LineString>;
    markerCoordinate?: MapCoord;
    followPosition?: boolean;
    prevRiderMarkers?: Array<PrevRiderMapMarker>;
}