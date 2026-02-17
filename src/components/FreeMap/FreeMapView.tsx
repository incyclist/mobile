import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { FreeMapViewProps } from './types';

export const FreeMapView = ({
    style,
    width = '100%',
    height = '100%',
    children,
}: FreeMapViewProps) => {
    return (
        <View style={[styles.container, { width, height }, style]}>
            <View style={styles.placeholder}>
                <Text style={styles.text}>
                    MapLibre Native Component
                </Text>
                <Text style={styles.subtext}>
                    (Not available in Web Storybook)
                </Text>
            </View>
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ccc',
        borderStyle: 'dashed',
    },
    placeholder: {
        alignItems: 'center',
    },
    text: {
        fontWeight: 'bold',
        color: '#666',
    },
    subtext: {
        fontSize: 12,
        color: '#999',
    },
});
