import { StyleProp, ViewStyle } from 'react-native';
import { IObserver, RouteApiDetail } from 'incyclist-services';

export interface ScaleConfig {
    value: number;
    unit: string;
}

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
    helmet?: string; // Specific override for the helmet
    type?: 'male' | 'female' | 'coach';
}

export interface RiderMarker {
    position: number; // Raw meters
    avatar?: AvatarConfig;
    isCurrentUser?: boolean;
}

export interface GraphPoint {
    x: number;
    y: number;
    slope: number;
    color: string;
}

export interface GraphDomain {
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
}

export interface GraphMargins {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

export interface ElevationGraphProps {
    routeData?: RouteApiDetail;
    initialPosition?: number;
    markers?: RiderMarker[];
    range?: number;
    lapMode?: boolean;
    pctReality?: number;
    showXAxis?: boolean;
    showYAxis?: boolean;
    showLine?: boolean;
    showColors?: boolean;
    minValue?: boolean;
    xScale?: ScaleConfig;
    yScale?: ScaleConfig;
    style?: StyleProp<ViewStyle>;
    backgroundColor?: string;
    axisFontSize?: number;
    markerPosition?: number; // Current user's position in raw meters
    currentAvatar?: AvatarConfig; // Current user's avatar config
    observer?: IObserver;
    positionEvent?: string;
    minElevationRange?: number; // Minimum y-axis span in meters
    windowUpdateInterval?: number; // Interval in ms to recompute windowed graph position
    previewColor?:string
}

export interface ElevationGraphViewProps extends ElevationGraphProps {
    width: number;
    height: number;
    graphPoints: GraphPoint[];
    domain: GraphDomain;
}