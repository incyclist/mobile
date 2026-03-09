/* eslint-disable react-native/no-inline-styles */
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { MainPageView } from './View';
import { View } from 'react-native';

const meta = {
  title: 'Pages/MainPage',
  component: MainPageView,  
      decorators: [
          (Story) => (
              <View style={{ height: '100%', width: '100%', justifyContent:'center', alignItems:'center' }}>
                  <Story />
              </View>
          )
      ],
  args: {
    onClick:fn()
  }
} satisfies Meta<typeof MainPageView>

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {}
};

