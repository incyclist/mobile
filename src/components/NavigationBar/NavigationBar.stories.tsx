import { NavigationBarView } from './NavigationBarView';
import { fn } from 'storybook/test';
import { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View, DimensionValue } from 'react-native';

const meta = {
    title: 'Components/NavigationBar',
    component: NavigationBarView,
    decorators: [
        (Story) => (
            <View style={{ height: '100vh' as DimensionValue, width: '100vw' as DimensionValue, justifyContent:'center', alignItems:'center' }}>
                <Story />
            </View>
        )
    ],  
    args:{
        onClick: fn(),
        iconSize: 40,
        navWidth: 150,
        showExit: true,
    }
} satisfies Meta<typeof NavigationBarView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        selected: 'routes',
    }
};

export const Compact: Story = {
    args: {
        compact: true,
        iconSize: 32,
        navWidth: 70,
        selected: 'activities',
    }
};

export const SettingsOpen: Story = {
    args: {
        showBackOnly: true,
        compact: false,
        iconSize: 40,
        navWidth: 150,
        showExit: false,
    }
};