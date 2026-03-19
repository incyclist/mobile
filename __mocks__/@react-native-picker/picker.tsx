import React from 'react';
import { View } from 'react-native';

const Picker = ({ children, onValueChange, selectedValue }: any) => (
    <View testID="picker" onTouchEnd={() => onValueChange?.(selectedValue)}>
        {children}
    </View>
);

Picker.Item = ({ label }: any) => null;

export { Picker };