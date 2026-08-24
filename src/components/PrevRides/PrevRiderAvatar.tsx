import React from 'react';
import Svg, { G, Path } from 'react-native-svg';
import { Avatar } from 'incyclist-services';
import {
    AVATAR_VIEWBOX,
    AVATAR_DEFAULT_COLORS,
    MALE_AVATAR_PATHS,
    AvatarColors,
} from '../../assets/avatars/male-paths';

export interface PrevRiderAvatarProps {
    avatar: Avatar;
    /** Target rendered height, in dp. Width is derived from the figure's own aspect ratio. */
    size?: number;
}

/**
 * A small, non-positioned rendering of the same SVG rider figure `AvatarMarker` draws on the
 * elevation graph/map (`../ElevationGraph/AvatarMarker.tsx`) — reused here for the tablet-tier
 * row's avatar slot rather than duplicating the artwork. `AvatarMarker` itself isn't reusable
 * as-is: it always positions the figure relative to a graph anchor point (`cx`/`cy`), which a
 * list row has no use for.
 *
 * Only `helmet`/`shirt` map onto the figure's richer per-part color set — everything else
 * (skin, hair, glasses, ...) keeps its default so a two-color `Avatar` value still reads as a
 * recognizable rider without needing those extra parts modeled on this simpler type.
 */
export const PrevRiderAvatar = ({ avatar, size = 28 }: PrevRiderAvatarProps) => {
    const overrides: Partial<AvatarColors> = {
        helmOuter: avatar.helmet,
        helmInner: avatar.helmet,
        shirt: avatar.shirt,
        shirtStripe: avatar.shirt,
    };
    const fill: AvatarColors = { ...AVATAR_DEFAULT_COLORS, ...overrides };

    const viewBoxParts = AVATAR_VIEWBOX.split(' ').map(Number);
    const [, , vbWidth, vbHeight] = viewBoxParts;
    const width = size * (vbWidth / vbHeight);

    return (
        <Svg width={width} height={size} viewBox={AVATAR_VIEWBOX} testID="prev-rider-avatar">
            <G>
                {MALE_AVATAR_PATHS.map((pathDef) => (
                    <Path key={pathDef.id} d={pathDef.d} fill={fill[pathDef.fillKey]} />
                ))}
            </G>
        </Svg>
    );
};
