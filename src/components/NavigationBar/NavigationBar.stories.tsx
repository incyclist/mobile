import { NavigationBar } from './NavigationBar';
import { fn } from 'storybook/test';
import { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

const meta = {
    title: 'Components/NavigationBar',
    component: NavigationBar,
    decorators: [
        (Story) => (
            <View style={{ height: '100vh', width: '100vw', justifyContent:'center', alignItems:'center' }}>
                <Story />
            </View>
        )
    ],  
    args:{
        onClick:fn()
    }
} satisfies Meta<typeof NavigationBar>

export default meta

type Story = StoryObj<typeof meta>;

export const Left: Story = {
    args: {
        position: 'left',
        selected: 'exit',
    }
    
};

export const Top: Story = {
    args: {
        position: 'top',
        selected: 'exit',
    }    
};

