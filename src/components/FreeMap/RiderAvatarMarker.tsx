import React, { useMemo } from 'react';
import Svg, { G, Path } from 'react-native-svg';
import { AvatarConfig } from './types';
import {
    AVATAR_VIEWBOX,
    AVATAR_DEFAULT_COLORS,
    MALE_AVATAR_PATHS,
    AvatarColors,
} from '../../assets/avatars/male-paths';

interface RiderAvatarMarkerProps {
    avatar?: AvatarConfig;
    // Target rendered height (dp); width is derived from the avatar's own aspect ratio.
    size?: number;
}

const [, , VIEWBOX_WIDTH, VIEWBOX_HEIGHT] = AVATAR_VIEWBOX.split(' ').map(Number);
const AVATAR_ASPECT_RATIO = VIEWBOX_WIDTH / VIEWBOX_HEIGHT;

// Full avatar SVG marker for a previous rider on FreeMap, reusing the same male-cyclist path
// data (`src/assets/avatars/male-paths.ts`) and color parameterization (shirt/helmet/skin/etc.)
// already ported from web-ui's Avatar component and used by `ElevationGraph`'s `AvatarMarker`.
// Unlike ElevationGraph's `AvatarMarker` (which renders a `<G>` nested inside an already-present
// plot `<Svg>`), this component owns its own `<Svg viewBox>` root, since FreeMap's marker wrapper
// is a bare `<View>` with no surrounding SVG canvas to nest into.
export const RiderAvatarMarker = ({ avatar, size = 32 }: RiderAvatarMarkerProps) => {
    const colors: AvatarColors = useMemo(() => ({
        ...AVATAR_DEFAULT_COLORS,
        ...avatar,
    }), [avatar]);

    const helmetOverride = avatar?.helmet;
    const width = size * AVATAR_ASPECT_RATIO;

    return (
        <Svg width={width} height={size} viewBox={AVATAR_VIEWBOX}>
            <G>
                {MALE_AVATAR_PATHS.map((pathDef) => (
                    <Path
                        key={pathDef.id}
                        d={pathDef.d}
                        fill={
                            pathDef.fillKey === 'helmOuter' && helmetOverride
                                ? helmetOverride
                                : colors[pathDef.fillKey]
                        }
                    />
                ))}
            </G>
        </Svg>
    );
};
