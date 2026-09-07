import type {
    UIRouteSettings, UIStartSettings, DownloadRowDisplayProps, AttachedWorkoutProps,
    RouteApiDetail, RoutePoint as ServiceRoutePoint, SmoothingGradient
} from 'incyclist-services';

export interface RouteDetailsDialogProps {
    routeId: string     
    onStart:()=>void
}

export interface RoutePoint {
    lat: number;
    lng: number;
    routeDistance: number;
    elevation: number;
    slope?: number;
}

/**
 * The recomputed profile for a smoothing level: the curve to draw and the elevation gain it adds
 * up to. Both are absent whenever there is nothing to show - level 0, a route that cannot be
 * smoothed, or a transform that could not be computed.
 */
export interface SmoothingPreviewProps {
    smoothedPoints?: ServiceRoutePoint[];
    smoothedElevation?: { value: number; unit: string };
    /**
     * What this level does to the gradient - the axis the rider actually feels through the
     * trainer, and the one that carries the signal: a real track's elevation curve barely moves
     * under smoothing (a fraction of a pixel), while its steepest gradient moves by a factor.
     */
    smoothedGradient?: SmoothingGradient;
}

/**
 * What a settings round-trip gives back. `prevRides`/`showPrev` are the past-activity lookup
 * that has always been here; the smoothed pair is the preview for the level now selected.
 *
 * Both halves come back from the same call because both are derived from the same settings -
 * the caller applies one set of settings and gets everything that follows from it. Querying the
 * preview is deliberately not the same thing as storing the level: the choice is only written
 * when the ride is actually started.
 */
export interface RouteSettingsChangeResult extends SmoothingPreviewProps {
    prevRides?: Array<any>;
    showPrev?: boolean;
}

export interface Segment {
    name: string;
    start: number | string;
    end: number | string;
}

export interface RouteDetailsViewProps extends SmoothingPreviewProps {
    // Header
    title: string;
    compact: boolean;

    // Panels
    hasGpx: boolean;
    points?: RoutePoint[];
    previewUrl?: string;
    /**
     * The route record the elevation profile is drawn from - `points` above only says whether
     * there is a profile to draw, `ElevationGraph` needs the whole record.
     */
    routeData?: RouteApiDetail;
    /**
     * Map tiles are fetched on demand, so the map is only offered while there is a network.
     * Mirrors the map gate on web, where the panel is left empty offline.
     */
    isOnline: boolean;

    // Info
    totalDistance: { value: number; unit: string };
    totalElevation: { value: number; unit: string };
    routeType: string;
    videoFormat?: string;
    segments?: Segment[];

    // Visibility flags
    canStart: boolean;
    canNotStartReason?: string;
    showLoopOverwrite: boolean;
    showNextOverwrite: boolean;
    showPrev: boolean;
    loading: boolean;
    downloadButtonPrimary?: boolean

    /**
     * Phase 2 (workout-mobile-hld-phase2.md §4.2) - the "Workout: <name> [x]" row and the
     * "Add Workout" button, driven by `attachedWorkout` (button when null, chip when set).
     */
    attachedWorkout: AttachedWorkoutProps | null;

    /**
     * Whether this route may be smoothed at all. False omits the control entirely - there is
     * nothing the user could do about a route the transform has no usable elevation track to
     * work from, so a disabled control would only name internal state. Deliberately separate
     * from the map and profile gates above: a route can be graphable and still not smoothable.
     */
    smoothingAvailable?: boolean;
    /** highest selectable level, so the range is not hardcoded here */
    smoothingMaxLevel?: number;
    /**
     * `smoothedPoints`/`smoothedElevation` (inherited above) carry the preview for the level
     * already stored on the route, so reopening a route that has one shows the smoothed curve
     * and figure straight away rather than only after the first tap.
     */

    // Settings
    initialSettings: UIRouteSettings;
    prevRides?: Array<any>;

    // Callbacks
    onStart: (settings: UIRouteSettings) => void;
    onCancel: () => void;
    onAddWorkout: (settings: UIRouteSettings) => void;
    onClearWorkout: () => void;
    onSettingsChanged: (settings: UIRouteSettings) => Promise<RouteSettingsChangeResult>;
    onUpdateStartPos: (value: number) => UIStartSettings | null;

    // Download props
    downloadButtonLabel?: string;
    downloadButtonDisabled?: boolean;
    onDownloadPress?: () => void;
    showDownloadModal?: boolean;
    onDownloadModalClose?: () => void;
    downloadRows?: DownloadRowDisplayProps[];
    onDownloadStop?: (routeId: string) => void;
    onDownloadRetry?: (routeId: string) => void;
    onDownloadDelete?: (routeId: string) => void;
}