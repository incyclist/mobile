import React from 'react';
import { View } from 'react-native';

const LinearGradient = ({ children, ...props }: any) => (
    <View {...props}>{children}</View>
);

export default LinearGradient;