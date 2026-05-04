import  { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { Observer } from 'incyclist-services';
import { RoutesTableProps } from './types';
import { RouteItem } from '../RouteItem';
 import { Dynamic } from '../Dynamic';
import { useLogging, useUnmountEffect } from '../../hooks';
import { colors, textSizes } from '../../theme';

const LOOKAHEAD = 5;
const ITEM_HEIGHT = 84; // ITEM_HEIGHT + MARGIN_V * 2

export const RoutesTable = memo(({
    routes,
}: RoutesTableProps) => {
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
    const [routesObserver] = useState(() => new Observer());


    // Initialize observer on mount
    useEffect(() => {
        if (refInitialized.current) return;
        refInitialized.current = true;
    }, []);

    useUnmountEffect(() => {
        refElementsOutsideFold.current = [];
        routesObserver.stop()
        refInitialized.current = false;
    });

    useEffect( ()=>{
        logEvent({message:'RoutesTable render done'})
    },[logEvent])

    const onScroll = useCallback((event: any) => {
        if (!routesObserver || !refElementsOutsideFold.current) return;
        
        const scrollY = event.nativeEvent.contentOffset.y;
        const viewportHeight = event.nativeEvent.layoutMeasurement.height;
        
        const firstVisible = Math.floor(scrollY / ITEM_HEIGHT);
        const lastVisible = Math.ceil((scrollY + viewportHeight) / ITEM_HEIGHT);

        routes?.forEach((_, i) => {
            const outsideFold = i > lastVisible + LOOKAHEAD || i < firstVisible;
            const prev = refElementsOutsideFold.current[i] ?? true;

            if (prev !== outsideFold) {
                routesObserver!.emit(`outsideFold-${i}`, outsideFold);
                refElementsOutsideFold.current[i] = outsideFold;
            }
        });
    }, [routes, routesObserver]);

    if (!routes?.length) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No routes available</Text>
            </View>
        );
    }

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
                        observer={routesObserver!}
                        event={`outsideFold-${index}`}
                        prop="outsideFold"
                    >
                    
                        <RouteItem
                            key={route.id}
                            {...route} 
                            outsideFold={routesObserver!=null ? initialFoldState[index] ?? true : true}
                        />
                    </Dynamic> 
                ))}
            </ScrollView>
        </View>
    );
}, (prev, next) => {
    if (prev.routes?.length !== next.routes?.length) return false;
    const prevHash = prev.routes?.map(r => r.id).join(':') ?? '';
    const nextHash = next.routes?.map(r => r.id).join(':') ?? '';
    return prevHash === nextHash;
});

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
