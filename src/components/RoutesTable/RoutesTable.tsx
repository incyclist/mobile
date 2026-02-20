import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { RoutesTableProps } from './types';
import { RouteItem } from '../RouteItem';

export const RoutesTable = ({ 
    routes, 
    onSelect, 
    onDelete,     
}: RoutesTableProps) => {

    const renderItem = useCallback(({ item }: any) => (
        <RouteItem
            {...item} 
            onSelect={onSelect} 
            onDelete={onDelete} 
        />
    ), [onSelect, onDelete]);

    const keyExtractor = useCallback((item: any) => item.id, []);

    return (
        <View style={styles.container}>
            <FlashList
                data={routes}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                // estimatedItemSize={78} // Height 70 + margins
                drawDistance={500}
                extraData={routes.length}
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