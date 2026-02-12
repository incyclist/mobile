import React from 'react';
import { StoryObj, Meta } from '@storybook/react';
import DeviceEntry from './index';
import { DeviceSelectionItemProps } from '../DeviceSelector/index';
import { View } from 'react-native';

const meta: Meta<DeviceSelectionItemProps> = {
  title: 'Components/DeviceEntry',
  component: DeviceEntry,
  decorators: [
    (Story) => (
      // Background color to match the dialog context
      <View style={{ backgroundColor: '#330066', width: 300 }}> 
        <Story />
      </View>
    ),
  ],
  args: {
    deviceName: 'Sample Device Name',
    value: 1,
    onClick: () => console.log('clicked'),
    onDelete: () => console.log('deleted'),
  },
};

export default meta;

type Story = StoryObj<DeviceSelectionItemProps>;

export const Disconnected: Story = {
    args: {
        ...meta.args,
        connectState: 'disconnected',
        interface: 'wifi',
    }
};

export const Connecting: Story = {
    args: {
        ...meta.args,
        connectState: 'connecting',
        interface: 'ble',
    }
};

export const Connected: Story = {
    args: {
        ...meta.args,
        connectState: 'connected',
        interface: 'wifi',
    }
};

export const Failed: Story = {
    args: {
        ...meta.args,
        connectState: 'failed',
        interface: 'ble',
    }
};

export const Selected: Story = {
    args: {
        ...meta.args,
        isSelected:true,
        connectState: 'disconnected',
        interface: 'wifi',
    }
};
