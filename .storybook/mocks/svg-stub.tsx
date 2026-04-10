import React from 'react';
import { View } from 'react-native-web';

/**
 * A generic stub for SVG assets imported as React components.
 * Renders a plain View to avoid crashes in the Storybook web renderer.
 */
const SvgStub = (props: any) => {
    return React.createElement(View, props);
};

export default SvgStub;