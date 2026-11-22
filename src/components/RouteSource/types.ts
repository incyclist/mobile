import type { RouteItemProps } from 'incyclist-services';

/** Where a route can be played from, exactly as the page service reports it. */
export type RouteSourceProps = Pick<RouteItemProps, 'availability' | 'sourceLabel' | 'unavailableReason'>;

export interface RouteSourcePillProps {
    availability?: RouteItemProps['availability'];
}

export type RouteSourceSublineProps = Pick<RouteSourceProps, 'availability' | 'sourceLabel'>;

export interface RouteSourceInfoProps extends RouteSourceProps {
    /** phone with less than 360 of height: the short hint */
    shortHint?: boolean;
    /** the layout has its own place for the reason (the can-not-start line); only the lines below it are shown */
    reasonShown?: boolean;
}

export interface RouteSourceExplainerProps {
    /** names of the computers that routes need and that can not be reached right now */
    computerNames: string[];
    onDismiss: () => void;
}
