import { Avatar } from 'incyclist-services';
import { ScreenLayout } from '../../hooks';

/**
 * One row of the previous-rides comparison list — position, gap-to-now, and (tablet only) the
 * richer desktop-parity fields. Defined locally rather than imported: the services-side release
 * that will export this exact shape hasn't reached npm yet, so a real page service can populate
 * plain object literals matching this shape today, and this component can be swapped over to the
 * published type with no further changes once that release lands.
 *
 * Every field is always populated by the caller regardless of tier — it is this component's job
 * to decide what to render for a given `layout`, not the caller's job to omit fields.
 */
export interface PrevRidesRowProps {
    position: number;
    /** Phone: short date or "You". Tablet: full name/date — already formatted by the caller. */
    label: string;
    /** Already formatted, e.g. "+0:08", "-1:24". */
    timeGap: string;
    /** Already formatted, e.g. "+120 m". Tablet only. */
    distanceGap?: string;
    isCurrent: boolean;
    /** Tablet only — undefined on phone rows by design. */
    avatar?: Avatar;
    /** km/h. Tablet only. */
    speed?: number;
    /** Watts. Tablet only. */
    power?: number;
    /** bpm. Tablet only. */
    heartrate?: number;
}

export interface PrevRidesRowComponentProps extends PrevRidesRowProps {
    /** `useScreenLayout()`'s result — passed in rather than read from the hook here so a list of
     *  rows computes it once and every row stays a plain, easily-tested pure component. */
    layout: ScreenLayout;
}

/**
 * The phone corner slot's own geometry (top/left-or-right/width/height) — mirrors
 * `useRideOverlayLayout()`'s `Rect` shape without importing it, since this component tree only
 * ever needs a plain rect, not the hook's full layout-decision machinery.
 */
export interface PrevRidesSlotRect {
    top: number;
    left?: number;
    right?: number;
    width: number;
    height: number;
}
