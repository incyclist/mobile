import React, { useCallback, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { RoutesTableProps } from './types';
import { RouteItem } from '../RouteItem';

export const RoutesTable = ({ 
    routes, 
    onSelect, 
    onDelete,     
}: RoutesTableProps) => {

    const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());

    const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
        setVisibleIds(new Set(
            viewableItems
                .filter((item: any) => item.isViewable)
                .map((item: any) => item.item.id)
        ));
    }, []);

    const viewabilityConfig = useRef({
        // Start rendering full content when item is 10% visible
        itemVisiblePercentThreshold: 10
    });

    const renderItem = useCallback(({ item }: any) => (
        <RouteItem
            key={item.id}
            {...item} 
            onSelect={onSelect} 
            onDelete={onDelete} 
            outsideFold={!visibleIds.has(item.id!)}
        />
    ), [onSelect, onDelete, visibleIds]);

    const keyExtractor = useCallback((item: any) => item.id, []);

    console.log(new Date().toISOString(),'# [Table] render table')

    return (
        <View style={styles.container}>
            <FlashList
                data={routes}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                estimatedItemSize={84}
                // Render 200px ahead of scroll for smoother transitions
                drawDistance={200}
                extraData={visibleIds}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig.current}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
    },
});