import { RouteItemProps } from 'incyclist-services';
import {  } from '../FreeMap/types';

export interface FormattedNumber {
    value: number;
    unit: string;
    display: string;
}

export interface RouteItemDisplayProps extends RouteItemProps {
    outsideFold?: boolean;
}

export interface RouteItemViewProps extends RouteItemDisplayProps {
    onLoadDetails?: () => void;
    onSelect:(id:string)=>void
    onDelete:(id:string)=>void
}
