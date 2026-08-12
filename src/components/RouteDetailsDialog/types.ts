import type { UIRouteSettings, UIStartSettings, DownloadRowDisplayProps, AttachedWorkoutProps } from 'incyclist-services';

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

export interface Segment {
    name: string;
    start: number | string;
    end: number | string;
}

export interface RouteDetailsViewProps {
    // Header
    title: string;
    compact: boolean;

    // Panels
    hasGpx: boolean;
    points?: RoutePoint[];
    previewUrl?: string;

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
     * Phase 2 (workout-mobile-hld-phase2.md §4.2/§9.1) - the "Workout: <name> [x]" row and the
     * "Add Workout" button, both driven only by `attachedWorkout` when `comboEnabled` is true
     * (button when null, chip when set).
     *
     * Repo-owner correction, 2026-08-11: this dialog previously fell back to
     * `cardProps.showWorkoutOption` (desktop's pre-Phase-2 "Start with Workout" signal) when
     * `comboEnabled` is false. That's correct on desktop, which already has route+workout
     * starting - but mobile does not, outside this phase's combo work. `showWorkoutOption` on
     * mobile only reflects `MOBILE_WORKOUTS` (workout-only rides, Phase 1) and has never known
     * about `MOBILE_WORKOUT_ROUTE_COMBO` - it was never a meaningful signal for this button on
     * mobile. `comboEnabled` false now always hides the button; `showWorkoutOption` is no
     * longer read here at all.
     */
    attachedWorkout: AttachedWorkoutProps | null;
    comboEnabled: boolean;

    // Settings
    initialSettings: UIRouteSettings;
    prevRides?: Array<any>;

    // Callbacks
    onStart: (settings: UIRouteSettings) => void;
    onCancel: () => void;
    onAddWorkout: (settings: UIRouteSettings) => void;
    onClearWorkout: () => void;
    onSettingsChanged: (settings: UIRouteSettings) => Promise<{
        prevRides?: Array<any>;
        showPrev?: boolean;
    }>;
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