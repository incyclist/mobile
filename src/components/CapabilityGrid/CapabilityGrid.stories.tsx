import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { CapabilityGrid } from './CapabilityGrid';
import { fn } from 'storybook/test';
import { View } from 'react-native';

const meta:Meta<typeof CapabilityGrid> = {
  title: 'Components/CapabilityGrid',
  component: CapabilityGrid,
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


export const Initial: Story = {
  args: {   
    capabilities: {
        top:[ 
            { header:{title:'control'},capability:'control',deviceName:'',onClick:fn() },
            { header:{title:'power'},capability:'power',deviceName:'',onClick:fn() },
            { header:{title:'heartrate'},capability:'heartrate',deviceName:'',onClick:fn() }
        ],
        bottom:[
            { header:{title:'speed'},capability:'speed',deviceName:'',onClick:fn() },
            { header:{title:'cadence'},capability:'cadence',deviceName:'',onClick:fn() },            
        ]
    }
  },
};


export const Paired: Story = {
  args: {   
    capabilities: {
        top:[ 
            { title:'control',capability:'control',deviceName:'DCSIM FTMS 1234',connectState:'connected', onClick:fn() },
            { title:'power',capability:'power',deviceName:'DCSIM FTMS 1234',value: 154, unit:'W' , onClick:fn() },
            { title:'heartrate',capability:'heartrate',deviceName:'HRM Dual',value:135, unit:'bpm', onClick:fn() }
        ],
        bottom:[
            { title:'cadence',capability:'cadence',deviceName:'DCSIM FTMS 1234',value:90, unit:'rpm',onClick:fn() },            
            { title:'speed',capability:'speed',deviceName:'DCSIM FTMS 1234',value:29.1, unit:'km/h',onClick:fn() },
        ]
    }
  },
};


export const PairedWaiting: Story = {
  args: {   
    capabilities: {
        top:[ 
            { title:'control',capability:'control',deviceName:'DCSIM FTMS 1234',connectState:'waiting', onClick:fn() },
            { title:'power',capability:'power',deviceName:'DCSIM FTMS 1234',value: 154, unit:'W' , onClick:fn() },
            { title:'heartrate',capability:'heartrate',deviceName:'HRM Dual',value:135, unit:'bpm', onClick:fn() }
        ],
        bottom:[
            { title:'cadence',capability:'cadence',deviceName:'DCSIM FTMS 1234',value:90, unit:'rpm',onClick:fn() },            
            { title:'speed',capability:'speed',deviceName:'DCSIM FTMS 1234',value:29.1, unit:'km/h',onClick:fn() },
        ]
    }
  },
};



