export type IconName = 
    | 'funnel' 
    | 'chevron-up' 
    | 'chevron-down' 
    | 'plus' 
    | 'import-route';

export interface IconProps {
    name: IconName;
    size?: number;    // default 24
    color?: string;   // default colors.text
}
