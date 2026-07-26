export interface ScheduledWorkoutPromptProps {
    visible: boolean;
    /** Scheduled workout's name, rendered bold inside the prompt copy. */
    title: string;
    onYes: () => void;
    onNo: () => void;
    onCheckWorkouts: () => void;
}
