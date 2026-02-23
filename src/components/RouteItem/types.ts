import { RouteItemProps } from 'incyclist-services';
import { LatLng } from '../FreeMap/types';

export interface FormattedNumber {
    value: number;
    unit: string;
    display: string;
}

export interface RoutePoint extends LatLng {
    time?: number;
    segment?: string;
    cnt?: number;
    heading?: number;
    routeDistance: number;
    elevation: number;
    elevationGain?: number;
    slope?: number;
    distance?: number;
    videoSpeed?: number;
    videoTime?: number;
    isCut?: boolean;
}

export interface RouteItemDisplayProps extends RouteItemProps {
    outsideFold?: boolean;
}

export interface RouteItemViewProps extends RouteItemDisplayProps {
    onLoadDetails?: () => void;
}
