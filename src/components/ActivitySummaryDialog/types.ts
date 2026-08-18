import { ActivityDetailsUI, WorkoutGraphActuals, WorkoutGraphPlan } from 'incyclist-services';

export interface ActivitySummaryDialogProps {
    onClose: () => void;   // dismiss -> back to RideMenu (caller's responsibility)
    onExit: () => void;    // navigate away (caller's responsibility)
}

export interface ActivityWorkoutSummaryGraph {
    plan: WorkoutGraphPlan;
    actuals: WorkoutGraphActuals;
}

export interface ActivitySummaryDialogViewProps {
    activity: ActivityDetailsUI;
    showMap: boolean;
    showSave: boolean;
    showContinue: boolean,
    // true for a route-less workout (no GPS/route data at all) - render workoutGraph instead of
    // the map/preview. Mutually exclusive with showMap in practice, but kept as its own flag
    // (rather than inferred from showMap being false) since "no map, no preview either" is also a
    // valid state (e.g. workoutGraph itself unavailable).
    showWorkoutSummary?: boolean;
    workoutGraph?: ActivityWorkoutSummaryGraph;
    preview?: string;
    units?: Record<string, string>;
    isSaving: boolean;
    isSaved: boolean;
    showDeleteConfirm: boolean;
    onSave: () => void;
    onClose: () => void;
    onDelete: () => void;
    onDeleteConfirm: () => void;
    onDeleteCancel: () => void;
    onShareFile: (path: string) => void;
    compact?: boolean;
}