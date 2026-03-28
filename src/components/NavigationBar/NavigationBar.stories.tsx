import { NavigationBarView } from './NavigationBarView';
import { NavigationBarViewCompact } from './NavigationBarViewCompact'; // New import
import { fn } from 'storybook/test';
import { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View, DimensionValue } from 'react-native';

const meta = {
    title: 'Components/NavigationBar',
    component: NavigationBarView, // Still targets NavigationBarView as primary component
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

export const CompactSidebar: Story = { // Renamed from Compact to clarify it's the vertical bar
    args: {
        compact: true,
        iconSize: 32,
        navWidth: 70,
        selected: 'activities',
    }
};

// New story for the compact horizontal view, explicitly rendering NavigationBarViewCompact
export const CompactHorizontal: Story = {
    render: (args) => (
        <NavigationBarViewCompact
            selected={args.selected as any} // Cast as TNavigationItem, args type is for NavigationBarView
            onClick={args.onClick}
            navHeight={56}
            showExit={false}
        />
    ),
    args: {
        selected: 'routes',
        onClick: fn(),
    },
    parameters: {
        // Configure viewport to simulate a compact (landscape phone) layout
        // 'iphone6p' has a width > height, simulating landscape
        viewport: {
            defaultViewport: 'iphone6p',
        },
        layout: 'fullscreen', // Ensure the component takes full available space for horizontal layout
    }
};