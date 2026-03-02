import React, { useMemo } from 'react';
import { G, Path, Circle } from 'react-native-svg';
import { AvatarConfig } from './types';
import {
    AVATAR_VIEWBOX,
    AVATAR_DEFAULT_COLORS,
    MALE_AVATAR_PATHS,
    AvatarColors,
} from '../../assets/avatars/male-paths';

interface AvatarMarkerProps {
    cx: number; // Pixel x position for the anchor dot
    cy: number; // Pixel y position for the anchor dot
    avatar?: AvatarConfig;
    size?: number; // Target height for the avatar
    isCurrentUser?: boolean;
}

export const AvatarMarker = ({
    cx,
    cy,
    avatar,
    size = 40,
    isCurrentUser: _isCurrentUser,
}: AvatarMarkerProps) => {
    const avatarColors: AvatarColors = useMemo(() => {
        return {
            ...AVATAR_DEFAULT_COLORS,
            ...avatar,
        };
    }, [avatar]);

    // Parse viewBox to get original width/height ratio
    const viewBoxParts = AVATAR_VIEWBOX.split(' ').map(Number);
    const originalWidth = viewBoxParts[2];
    const originalHeight = viewBoxParts[3];

    // size is the target height for the avatar
    const avatarHeight = size;
    const avatarWidth = avatarHeight * (originalWidth / originalHeight);

    // Position avatar: centered horizontally over cx, bottom edge just above cy
    const avatarX = cx - avatarWidth / 2;
    const avatarY = cy - avatarHeight;

    const helmetOverride = avatar?.helmet;

    // Calculate scale factor for the avatar paths
    const scaleX = avatarWidth / originalWidth;
    const scaleY = avatarHeight / originalHeight;

    return (
        <G>
            {/* Anchor dot */}
            <Circle
                cx={cx}
                cy={cy}
                r={3}
                fill="#ffdd33" // Yellow fill
                stroke="#d32f2f" // Red stroke
                strokeWidth={1}
            />

            {/* Avatar - using G with transform instead of nested Svg */}
            <G 
                transform={`translate(${avatarX}, ${avatarY}) scale(${scaleX}, ${scaleY})`}
                className="avatar_male"
            >
                {MALE_AVATAR_PATHS.map((pathDef) => (
                    <Path
                        key={pathDef.id}
                        d={pathDef.d}
                        fill={
                            pathDef.fillKey === 'helmOuter' && helmetOverride
                                ? helmetOverride
                                : avatarColors[pathDef.fillKey]
                        }
                    />
                ))}
            </G>
        </G>
    );
};
