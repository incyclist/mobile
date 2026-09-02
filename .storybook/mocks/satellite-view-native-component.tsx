import React from 'react';
import { View, StyleSheet } from 'react-native';

const SatelliteViewNativeComponent = (props: any) => (
    <View
        {...props}
        style={[styles.placeholder, props.style]}
    />
);

const styles = StyleSheet.create({
    placeholder: {
        backgroundColor: 'rgba(90,120,60,0.35)',
    },
});

export default SatelliteViewNativeComponent;
