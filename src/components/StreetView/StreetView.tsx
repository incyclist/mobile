import React from 'react';
import { StyleSheet } from 'react-native';
import StreetViewNativeComponent from '../../specs/StreetViewNativeComponent';
import { StreetViewProps } from './types';

export const StreetView = (props: StreetViewProps) => {
    const { style, ...rest } = props;
    return (
        <StreetViewNativeComponent
            {...rest}
            style={[StyleSheet.absoluteFill, style]}
        />
    );
};