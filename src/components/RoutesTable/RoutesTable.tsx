import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { Observer } from 'incyclist-services';
import { RoutesTableProps } from './types';
import { RouteItem } from '../RouteItem';
 import { Dynamic } from '../Dynamic';
import { useLogging, useUnmountEffect } from '../../hooks';
import { colors, textSizes } from '../../theme';

const LOOKAHEAD = 5;
const ITEM_HEIGHT = 84; // ITEM_HEIGHT + MARGIN_V * 2

export const RoutesTable = ({ 
    routes, 
}: RoutesTableProps) => {
    const refObserver = useRef<Observer | null>(null);
    const refInitialized = useRef(false);
    const {logEvent} = useLogging('RoutesTable')

    // Synchronously compute initial fold state during render
    const estimatedVisible = Math.ceil(600 / ITEM_HEIGHT);
    const initialActiveCount = estimatedVisible + LOOKAHEAD;

    const initialFoldState = useMemo(() => 
        routes?.map((_, i) => i >= initialActiveCount) ?? []
    , [routes, initialActiveCount]);

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

    useEffect( ()=>{
        logEvent({message:'RoutesTable render done'})
    },[logEvent])

    const onScroll = useCallback((event: any) => {
        if (!refObserver.current || !refElementsOutsideFold.current) return;
        
        const scrollY = event.nativeEvent.contentOffset.y;
        const viewportHeight = event.nativeEvent.layoutMeasurement.height;
        
        const firstVisible = Math.floor(scrollY / ITEM_HEIGHT);
        const lastVisible = Math.ceil((scrollY + viewportHeight) / ITEM_HEIGHT);

        routes?.forEach((_, i) => {
            const outsideFold = i > lastVisible + LOOKAHEAD || i < firstVisible;
            const prev = refElementsOutsideFold.current[i] ?? true;

            if (prev !== outsideFold) {
                refObserver.current!.emit(`outsideFold-${i}`, outsideFold);
                refElementsOutsideFold.current[i] = outsideFold;
            }
        });
    }, [routes]);

    if (!routes?.length) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No routes available</Text>
            </View>
        );
    }

    logEvent({message:'RoutesTable render',cnt:routes?.length})

    return (
        <View style={styles.container}>
            <ScrollView 
                onScroll={onScroll}
                scrollEventThrottle={16}
                style={styles.scroll}
            >
                {routes?.map((route, index) => (
                    
                    <Dynamic
                        key={route.id}
                        observer={refObserver.current!}
                        event={`outsideFold-${index}`}
                        prop="outsideFold"
                    >
                    
                        <RouteItem
                            key={route.id}
                            {...route} 
                            outsideFold={index>10}
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
