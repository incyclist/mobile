import {
    Workout,
    WorkoutListContentProps,
    WorkoutListItemProps,
    ScheduledWorkoutItemProps,
} from 'incyclist-services';

/**
 * Storybook/dev fixtures for `WorkoutsTable`. Unlike `WorkoutGraph.mock.ts` (which hands the
 * graph pre-built `WorkoutGraphPlanBar[]`), `WorkoutsTable` itself converts each row's real
 * `Workout` into a plan via `getWorkoutGraphSeries()` (services session 2.2) — so these fixtures
 * are real `Workout` instances, not pre-built bars, to exercise that conversion honestly.
 */

const step = (duration: number, min: number, max: number, steady = true) => ({
    type: 'step' as const,
    duration,
    power: { min, max, type: 'pct of FTP' as const },
    steady,
});

const buildWorkout = (id: string, name: string, steps: ReturnType<typeof step>[]): Workout =>
    new Workout({ type: 'workout', id, name, steps });

export const MOCK_WORKOUT_VO2 = buildWorkout('w-1', '3x VO2 Max Intervals', [
    step(300, 40, 60),
    step(180, 110, 120, false),
    step(120, 40, 50),
    step(180, 110, 120, false),
    step(120, 40, 50),
    step(180, 110, 120, false),
    step(300, 30, 40),
]);

export const MOCK_WORKOUT_SWEETSPOT = buildWorkout('w-2', 'Sweet Spot Base', [
    step(600, 40, 60),
    step(2400, 88, 94),
    step(600, 30, 40),
]);

export const MOCK_WORKOUT_RECOVERY = buildWorkout('w-3', 'Recovery Spin', [
    step(600, 35, 45),
]);

export const MOCK_WORKOUT_THRESHOLD = buildWorkout('w-4', 'Threshold Progression', [
    step(300, 40, 60),
    step(600, 80, 85),
    step(600, 90, 95),
    step(600, 95, 100),
    step(300, 30, 40),
]);

export const MOCK_WORKOUT_ENDURANCE = buildWorkout('w-5', 'Extended Endurance with Cooldown', [
    step(600, 40, 65),
    step(4200, 60, 70),
    step(600, 30, 40),
]);

export const MOCK_WORKOUTS: WorkoutListItemProps[] = [
    { id: 'w-1', title: MOCK_WORKOUT_VO2.name, group: 'FTP Builder', duration: '35min', selected: false, canDelete: true, workout: MOCK_WORKOUT_VO2 },
    { id: 'w-2', title: MOCK_WORKOUT_SWEETSPOT.name, group: 'FTP Builder', duration: '60min', selected: false, canDelete: true, workout: MOCK_WORKOUT_SWEETSPOT },
    { id: 'w-3', title: MOCK_WORKOUT_RECOVERY.name, group: 'My Workouts', duration: '10min', selected: false, canDelete: true, workout: MOCK_WORKOUT_RECOVERY },
    { id: 'w-4', title: MOCK_WORKOUT_THRESHOLD.name, group: 'My Workouts', duration: '45min', selected: false, canDelete: true, workout: MOCK_WORKOUT_THRESHOLD },
    { id: 'w-5', title: MOCK_WORKOUT_ENDURANCE.name, group: 'Zwift Academy 2021', duration: '90min', selected: false, canDelete: true, workout: MOCK_WORKOUT_ENDURANCE },
];

const day = (offset: number): Date => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d;
};

export const mockScheduled = (n: number): ScheduledWorkoutItemProps[] =>
    [
        { id: 'sched-1', title: 'Sweet Spot 3x12', date: day(0), duration: '60min', isToday: true, selected: false, workout: MOCK_WORKOUT_SWEETSPOT },
        { id: 'sched-2', title: 'VO2 Max Repeats', date: day(2), duration: '35min', isToday: false, selected: false, workout: MOCK_WORKOUT_VO2 },
        { id: 'sched-3', title: 'Endurance + Bursts', date: day(4), duration: '75min', isToday: false, selected: false, workout: MOCK_WORKOUT_ENDURANCE },
        { id: 'sched-4', title: 'Recovery Spin', date: day(6), duration: '30min', isToday: false, selected: false, workout: MOCK_WORKOUT_RECOVERY },
    ].slice(0, n);

export const MOCK_CONTENT: WorkoutListContentProps = {
    pageType: 'list',
    loading: false,
    upcoming: { items: mockScheduled(4), collapsedCount: 2, todayId: 'sched-1' },
    groups: { available: ['My Workouts', 'FTP Builder', 'Zwift Academy 2021'], selected: null },
    workouts: MOCK_WORKOUTS,
    selectedId: null,
    isEmpty: false,
    detailWorkoutId: null,
};

export const MOCK_CONTENT_MANY_GROUPS: WorkoutListContentProps = {
    ...MOCK_CONTENT,
    groups: {
        available: ['My Workouts', 'FTP Builder', 'Zwift Academy 2021', 'Climbing Prep', 'Base Season', 'Sprint Work', 'Recovery'],
        selected: null,
    },
};

export const MOCK_CONTENT_EMPTY: WorkoutListContentProps = {
    pageType: 'list',
    loading: false,
    upcoming: null,
    groups: { available: [], selected: null },
    workouts: [],
    selectedId: null,
    isEmpty: true,
    detailWorkoutId: null,
};
