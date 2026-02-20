import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { RoutesPageView } from './View';
import { View } from 'react-native';

const meta = {
  title: 'Pages/RoutesPage',
  component: RoutesPageView,  
      decorators: [
          (Story) => (
              <View style={{ height: '100vh', width: '100vw', justifyContent:'center', alignItems:'center' }}>
                  <Story />
              </View>
          )
      ],
  args: {
    onClick:fn()
  }
} satisfies Meta<typeof RoutesPageView>

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {}
};

