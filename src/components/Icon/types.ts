export type IconName =
    | 'funnel'
    | 'chevron-up'
    | 'chevron-down'
    | 'plus'
    | 'import-route'
    | 'time'
    | 'slope'
    | 'route'
    | 'speed'
    | 'power'
    | 'heartrate'
    | 'cadence'
    | 'gear'
    | 'distance'
    | 'elevation'
    ;

export interface IconProps {
    name: IconName;
    size?: number;    // default 24
    color?: string;   // default colors.text
}
