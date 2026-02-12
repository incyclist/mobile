import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { CapabilityTile } from './CapabilityTile';
import { fn } from 'storybook/test';
import { View } from 'react-native';

const meta:Meta<typeof CapabilityTile> = {
  title: 'Components/CapabilityTile',
  component: CapabilityTile,
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // Use `fn` to spy on the onPress arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#story-args
  decorators: [
    (Story) => (
      /* 
         This View ensures the 'middle' flex: 1 component has 
         a parent with a defined height to expand into. 
      */
      <View style={{ height: '100vh', width: '100vw', justifyContent:'center', alignItems:'center' }}>
        <Story />
      </View>
    ),
  ],  
}

export default meta;

type Story = StoryObj<typeof meta>;


export const ControlSmall:  Story= {
  args: {   
    height:80,
    title:'control',
    capability:'control',
    deviceName:'KICKR CORE 0000',
    connectState:'connected',

    onClick:fn() 
  }
};

export const ControlLarge: Story = {
  args: {   
    height:200,
    title:'control',
    interface:'wifi',
    capability:'control',
    deviceName:'KICKR CORE 0000',
    connectState:'failed',
    onClick:fn() 
  }
};

export const Power:  Story= {
  args: {   
    height:160,
    title:'power',
    capability:'power',
    deviceName:'KICKR CORE 0000',
    interface:'ble',
    connectState:'connected',
    value:'150',
    unit:'W',

    onClick:fn() 
  }
};

export const NoDevice:  Story= {
  args: {   
    height:160,
    title:'power',
    capability:'power',
    deviceName:undefined,
    interface:'ble',
    connectState:'connected',
    value:undefined,
    unit:undefined,

    onClick:fn() 
  }
};

export const UndefinedUnits:  Story= {
  args: {   
    height:160,
    title:'power',
    capability:'power',
    deviceName:'KICKR CORE 0000',
    interface:'ble',
    connectState:'connected',
    value:undefined,
    unit:undefined,

    onClick:fn() 
  }
};
