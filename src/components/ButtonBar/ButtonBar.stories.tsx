import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { ButtonBar } from './ButtonBar';
import { fn } from 'storybook/test';


const meta:Meta<typeof ButtonBar> = {
  title: 'Components/ButtonBar',
  component: ButtonBar,
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // Use `fn` to spy on the onPress arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#story-args
  
}

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {   
    buttons: [
        {label:'OK', primary:true, onClick:fn() }
    ]
  },
};

export const Multiple: Story = {
  args: {   
    buttons: [
        {label:'OK', primary:true, onClick:fn() },
        {label:'Cancel', primary:false, onClick:fn() },
        {label:'Exit', attention:true, onClick:fn() }
    ]
  },
};
