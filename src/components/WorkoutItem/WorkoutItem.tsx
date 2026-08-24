import React, { useCallback } from 'react';
import { getWorkoutListPageService, formatDateTime } from 'incyclist-services';
import { WorkoutItemView } from './WorkoutItemView';
import { useLogging } from '../../hooks';
import { WorkoutItemDisplayProps } from './types';

export const WorkoutItem = (props: WorkoutItemDisplayProps) => {
    const { date, isToday, ...rest } = props;

    const page = getWorkoutListPageService();
    const { logError,logEvent } = useLogging('WorkoutItem');

    const title = props?.title
    const id = props?.id
    const onOpenDetails = useCallback( (workoutId: string) => { 
            logEvent({message:'item selected', id, title, eventSource:'user' })                
            page.onOpenDetails(workoutId) 
        },
        [id, logEvent, page, title]
    );

    const onDelete = useCallback( (workoutId: string) => {
            logEvent({message:'item deleted', id, title, eventSource:'user' })        
            page.onDelete(workoutId).catch(err => logError(err, 'onDelete'));
        },
        [logEvent, id, title, page, logError]
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
