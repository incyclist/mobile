import type { StorybookConfig } from '@storybook/react-native-web-vite';

const config: StorybookConfig = {
    stories: [
        "../src/components/**/*.stories.@(js|jsx|mjs|ts|tsx)",
        "../src/pages/**/*.stories.@(js|jsx|mjs|ts|tsx)"

    ],
    addons: ['@storybook/addon-docs'],
    framework: "@storybook/react-native-web-vite",

    viteFinal: async (config:any) => {
        config.resolve.alias = {
        ...config.resolve.alias,
        
        'react-native-safe-area-context': 'react-native-web-safe-area-context',
        };
        return config;
    },
};
export default config;