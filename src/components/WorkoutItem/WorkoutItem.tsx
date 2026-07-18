import React, { useCallback } from 'react';
import { getWorkoutListPageService, formatDateTime } from 'incyclist-services';
import { WorkoutItemView } from './WorkoutItemView';
import { useLogging } from '../../hooks';
import { WorkoutItemDisplayProps } from './types';

export const WorkoutItem = (props: WorkoutItemDisplayProps) => {
    const { date, isToday, ...rest } = props;

    const page = getWorkoutListPageService();
    const { logError } = useLogging('WorkoutItem');

    const onOpenDetails = useCallback(
        (workoutId: string) => page.onOpenDetails(workoutId),
        [page]
    );

    const onDelete = useCallback(
        (workoutId: string) => {
            page.onDelete(workoutId).catch(err => logError(err, 'onDelete'));
        },
        [page, logError]
    );

    // "Today" when isToday, otherwise a plain date — computed here, not in
    // WorkoutItemView, since the pure View must never import incyclist-services
    // (mobile CLAUDE.md rule 7).
    let scheduledLabel: string | null = null;
    if (date) {
        scheduledLabel = isToday ? 'Today' : formatDateTime(date, '%d.%m.%Y');
    }

    return (
        <WorkoutItemView
            {...rest}
            isToday={isToday}
            scheduledLabel={scheduledLabel}
            onOpenDetails={onOpenDetails}
            onDelete={onDelete}
        />
    );
};
