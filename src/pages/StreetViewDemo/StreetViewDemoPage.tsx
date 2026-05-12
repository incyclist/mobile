import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { StreetView } from '../../components/StreetView';
import { colors, textSizes } from '../../theme';

const COORDINATES = [
    { lat: 40.758, lng: -73.9855, heading: 0,   label: 'Times Square N' },
    { lat: 40.758, lng: -73.9855, heading: 90,  label: 'Times Square E' },
    { lat: 40.758, lng: -73.9855, heading: 180, label: 'Times Square S' },
    { lat: 51.5055, lng: -0.0754, heading: 0,   label: 'Tower Bridge N' },
    { lat: 51.5055, lng: -0.0754, heading: 270, label: 'Tower Bridge W' },
];

export const StreetViewDemoPage = () => {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % COORDINATES.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const current = COORDINATES[index];

    return (
        <View style={styles.container}>
            <StreetView
                latitude={current.lat}
                longitude={current.lng}
                heading={current.heading}
                style={styles.streetView}
            />
            <View style={styles.overlay}>
                <Text style={styles.text}>Index: {index}</Text>
                <Text style={styles.text}>Label: {current.label}</Text>
                <Text style={styles.text}>Lat: {current.lat}</Text>
                <Text style={styles.text}>Lng: {current.lng}</Text>
                <Text style={styles.text}>Heading: {current.heading}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    streetView: {
        flex: 1,
    },
    overlay: {
        position: 'absolute',
        top: 20,
        left: 20,
        backgroundColor: 'rgba(0,0,0,0.45)',
        padding: 10,
        borderRadius: 4,
        zIndex: 10,
    },
    text: {
        color: colors.text,
        fontSize: textSizes.smallText,
    },
});