import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { Observer } from 'incyclist-services';
import { ActivitiesTableProps } from './types';
import { ActivityListItem, ACTIVITY_LIST_ITEM_HEIGHT } from '../ActivityListItem';
import { Dynamic } from '../Dynamic';
import { useUnmountEffect } from '../../hooks';
import { colors, textSizes } from '../../theme';

const LOOKAHEAD = 5;
const ITEM_HEIGHT = ACTIVITY_LIST_ITEM_HEIGHT + 8; // Height (72) + marginVertical (4 * 2)

export const ActivitiesTable = ({ activities, onSelect }: ActivitiesTableProps) => {
    const refObserver = useRef<Observer | null>(null);
    const refInitialized = useRef(false);

    // Synchronously compute initial fold state during render
    const estimatedVisible = Math.ceil(500 / ITEM_HEIGHT);
    const initialActiveCount = estimatedVisible + LOOKAHEAD;

    const initialFoldState = useMemo(
        () => activities?.map((_, i) => i >= initialActiveCount) ?? [],
        [activities, initialActiveCount]
    );

    // Track current fold state in a ref for the onScroll handler
    const refElementsOutsideFold = useRef<boolean[]>(initialFoldState);

    // Initialize observer on mount
    useEffect(() => {
        if (refInitialized.current) return;
        refInitialized.current = true;
        refObserver.current = new Observer();
    }, []);

    useUnmountEffect(() => {
        refElementsOutsideFold.current = [];
        refObserver.current = null;
        refInitialized.current = false;
    });

    const onScroll = useCallback(
        (event: any) => {
            if (!refObserver.current || !refElementsOutsideFold.current) return;

            const scrollY = event.nativeEvent.contentOffset.y;
            const viewportHeight = event.nativeEvent.layoutMeasurement.height;

            const firstVisible = Math.floor(scrollY / ITEM_HEIGHT);
            const lastVisible = Math.ceil((scrollY + viewportHeight) / ITEM_HEIGHT);

            activities?.forEach((_, i) => {
                const outsideFold = i > lastVisible + LOOKAHEAD || i < firstVisible;
                const prev = refElementsOutsideFold.current[i] ?? true;

                if (prev !== outsideFold) {
                    refObserver.current!.emit(`outsideFold-${i}`, outsideFold);
                    refElementsOutsideFold.current[i] = outsideFold;
                }
            });
        },
        [activities]
    );

    if (!activities?.length) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No activities available</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView onScroll={onScroll} scrollEventThrottle={16} style={styles.scroll}>
                {activities?.map((activity, index) => (
                    <Dynamic
                        key={activity.summary.id}
                        observer={refObserver.current!}
                        event={`outsideFold-${index}`}
                        prop="outsideFold"
                    >
                        <ActivityListItem
                            activityInfo={activity}
                            onPress={onSelect}
                            outsideFold={initialFoldState[index]}
                        />
                    </Dynamic>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
    },
    scroll: {
        flex: 1,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        color: colors.text,
        fontSize: textSizes.noDataText,
    },
});