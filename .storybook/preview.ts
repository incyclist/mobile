import type { Preview } from '@storybook/react-native-web-vite'
import { getBindings } from 'incyclist-services';
import { mockCryptoBinding } from './bindings/crypto';

// Register mock bindings so incyclist-services works in Storybook without
// native modules. This must run at module level (not inside a decorator)
// so it fires before any story component mounts and calls a service.
const bindings = getBindings();
bindings.crypto = mockCryptoBinding;




export const allViewPorts = () => {
    return Object.values(customViewports)
        .map(vp=>({ name:vp.name, ...vp.styles}));
}

export const customViewports = {
    // HIGH-END PHONES
    iphone15Pro: {
        name: 'iPhone 15 Pro',
        styles: { width: '852px', height: '393px' },
        // type: 'mobile',

    },
    pixel8Pro: {
        name: 'Google Pixel 8 Pro',
        styles: { width: '915px', height: '412px' },
        // type: 'mobile',
    },
    s23Ultra: {
        name: 'Samsung Galaxy S23 Ultra',
        styles: { width: '854px', height: '384px' },
        // type: 'mobile',
    },

        // TABLETS
    ipadPro12: {
        name: 'iPad Pro 12.9"',
        styles: { width: '1366px', height: '1024px' },
        // type: 'tablet',
    },
    ipadAir: {
        name: 'iPad Air',
        styles: { width: '1180px', height: '820px' },
        // type: 'tablet',
    },
    tabS9: {
        name: 'Samsung Galaxy Tab S9',
        styles: { width: '1600px', height: '1000px' }, // Landscape Beispiel
        // type: 'tablet',
    },

}

const preview: Preview = {
  parameters: {
    viewport: {
        options: customViewports,
    },    
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
  },
};

export default preview;