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
     * Phase 2 (workout-mobile-hld-phase2.md §4.2) - the "Workout: <name> [x]" row and the
     * "Add Workout" button, driven by `attachedWorkout` (button when null, chip when set).
     */
    attachedWorkout: AttachedWorkoutProps | null;

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