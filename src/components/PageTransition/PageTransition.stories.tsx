import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { PageTransitionView } from './PageTransition';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

const meta: Meta<typeof PageTransitionView> = {
    title: 'Components/PageTransitionView',
    component: PageTransitionView,
    decorators: [
        (Story) => {
            const { width, height } = useWindowDimensions();
            const containerStyle = { width, height };
            return (
                <View style={[styles.storyContainer, containerStyle]}>
                    <Story />
                </View>
            );
        },
    ],

    args: {
    },
};

const styles = StyleSheet.create({
    storyContainer: {
        position: 'relative',
        backgroundColor: '#333',
    },
});

export default meta;

type Story = StoryObj<typeof PageTransitionView>;

export const Default: Story = {
    args: {
        selected:'routes'
    },
};
