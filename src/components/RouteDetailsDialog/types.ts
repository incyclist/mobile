import type { UIRouteSettings, UIStartSettings } from 'incyclist-services';

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
    showWorkout: boolean;
    showPrev: boolean;
    loading: boolean;

    // Settings
    initialSettings: UIRouteSettings;
    prevRides?: Array<any>;

    // Callbacks
    onStart: (settings: UIRouteSettings) => void;
    onCancel: () => void;
    onStartWithWorkout: (settings: UIRouteSettings) => void;
    onSettingsChanged: (settings: UIRouteSettings) => Promise<{
        prevRides?: Array<any>;
        showPrev?: boolean;
    }>;
    onUpdateStartPos: (value: number) => UIStartSettings | null;
}
