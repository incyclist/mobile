import React from 'react';
import { Svg, Path } from 'react-native-svg';
import { colors } from '../../theme';
import { IconProps, IconName } from './types';

const icons: Record<IconName, (color: string, size: number) => React.ReactElement> = {
    'funnel': (color, size) => (
        <Svg viewBox='0 0 24 24' width={size} height={size}>
            <Path d='M3 4h18L13 14v7l-2-1v-6L3 4z' fill={color} />
        </Svg>
    ),
    'chevron-up': (color, size) => (
        <Svg viewBox='0 0 24 24' width={size} height={size}>
            <Path 
                d='M18 15l-6-6-6 6' 
                stroke={color} 
                strokeWidth={2}
                strokeLinecap='round' 
                strokeLinejoin='round' 
                fill='none' 
            />
        </Svg>
    ),
    'chevron-down': (color, size) => (
        <Svg viewBox='0 0 24 24' width={size} height={size}>
            <Path 
                d='M6 9l6 6 6-6' 
                stroke={color} 
                strokeWidth={2}
                strokeLinecap='round' 
                strokeLinejoin='round' 
                fill='none' 
            />
        </Svg>
    ),
    'plus': (color, size) => (
        <Svg viewBox='0 0 24 24' width={size} height={size}>
            <Path 
                d='M12 5v14M5 12h14' 
                stroke={color} 
                strokeWidth={2}
                strokeLinecap='round' 
                fill='none' 
            />
        </Svg>
    ),
    'import-route': (color, size) => (
        <Svg viewBox='0 0 24 24' width={size} height={size}>
            <Path 
                d='M12 3v12m0 0l-4-4m4 4l4-4M3 19h18'
                stroke={color} 
                strokeWidth={2}
                strokeLinecap='round' 
                strokeLinejoin='round' 
                fill='none' 
            />
        </Svg>
    ),
};

export const Icon = ({ name, size = 24, color = colors.text }: IconProps) => {
    const renderIcon = icons[name];
    if (!renderIcon) return null;
    return renderIcon(color, size);
};
