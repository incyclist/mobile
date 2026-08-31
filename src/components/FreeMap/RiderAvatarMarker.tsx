import React, { useMemo } from 'react';
import Svg, { G, Path, Circle } from 'react-native-svg';
import { AvatarConfig } from './types';
import {
    AVATAR_VIEWBOX,
    AVATAR_DEFAULT_COLORS,
    MALE_AVATAR_PATHS,
    AvatarColors,
} from '../../assets/avatars/male-paths';

interface RiderAvatarMarkerProps {
    avatar?: AvatarConfig;
    // Target rendered height (dp) of the avatar figure itself; width is derived from the
    // avatar's own aspect ratio. The rendered SVG canvas is taller than this - see below.
    size?: number;
}

const [, , VIEWBOX_WIDTH, VIEWBOX_HEIGHT] = AVATAR_VIEWBOX.split(' ').map(Number);
const AVATAR_ASPECT_RATIO = VIEWBOX_WIDTH / VIEWBOX_HEIGHT;

// Full avatar SVG marker for another rider (via FreeMap's `riderMarkers` prop — fed by PrevRides
// or Nearby Riders) or the current rider (via FreeMap's optional `markerAvatar` prop) on FreeMap,
// reusing the same male-cyclist path data
// (`src/assets/avatars/male-paths.ts`) and color parameterization (shirt/helmet/skin/etc.)
// already ported from web-ui's Avatar component and used by `ElevationGraph`'s `AvatarMarker`.
//
// The native marker APIs (MapLibre's `ViewAnnotation` on Android, Apple Maps' `Marker` on iOS)
// both anchor this whole component's bounding-box *center* on the true map coordinate by
// default. A standing human figure's own bounding-box center sits roughly at the torso, not the
// feet, so centering the figure itself puts its feet visibly above the true position - and any
// small rendering difference between platforms (Android's offscreen bitmap capture vs iOS's live
// view hosting) can make that offset read differently on each. Fix: render an explicit anchor
// dot (same yellow-fill/red-stroke convention as `ElevationGraph`'s `AvatarMarker`) at the
// canvas's exact center, with the avatar's feet resting on it - the canvas is twice the avatar's
// own height, avatar in the top half, dot at the midpoint, empty space below. Whatever offset a
// platform's native anchor applies, it now applies to a shape whose true-position marker is
// drawn explicitly, rather than to an implicit assumption about where a person's "position" is
// on their own silhouette.
export const RiderAvatarMarker = ({ avatar, size = 32 }: RiderAvatarMarkerProps) => {
    const colors: AvatarColors = useMemo(() => ({
        ...AVATAR_DEFAULT_COLORS,
        ...avatar,
    }), [avatar]);

    const helmetOverride = avatar?.helmet;
    const avatarWidth = size * AVATAR_ASPECT_RATIO;
    const canvasHeight = size * 2;
    const cx = avatarWidth / 2;
    const cy = size; // avatar's feet, and the canvas's vertical center
    const scaleX = avatarWidth / VIEWBOX_WIDTH;
    const scaleY = size / VIEWBOX_HEIGHT;

    return (
        <Svg width={avatarWidth} height={canvasHeight}>
            <G transform={`scale(${scaleX}, ${scaleY})`}>
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
            <Circle cx={cx} cy={cy} r={3} fill="#ffdd33" stroke="#d32f2f" strokeWidth={1} />
        </Svg>
    );
};
