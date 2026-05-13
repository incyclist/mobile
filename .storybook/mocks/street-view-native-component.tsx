import React from 'react';
import { View, StyleSheet } from 'react-native';

const StreetViewNativeComponent = (props: any) => (
    <View
        {...props}
        style={[styles.placeholder, props.style]}
    />
);

const styles = StyleSheet.create({
    placeholder: {
        backgroundColor: 'rgba(0,200,200,0.3)',
    },
});

export default StreetViewNativeComponent;