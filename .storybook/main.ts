import type { StorybookConfig } from '@storybook/react-native-web-vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { mergeConfig } from 'vite'; 
import svgr from 'vite-plugin-svgr'; // 1. Import the plugin


const config: StorybookConfig = {
    stories: [
        "../src/components/**/*.stories.@(js|jsx|mjs|ts|tsx)",
        "../src/pages/**/*.stories.@(js|jsx|mjs|ts|tsx)"

    ],
    
    addons: ['@storybook/addon-docs'],
    framework: "@storybook/react-native-web-vite",

    viteFinal: async (config:any) => {
        return mergeConfig(config, {
            plugins: [
                tsconfigPaths(), // Automatically syncs tsconfig.json paths
                svgr({ include: "**/*.svg", })  // This ensures it works exactly like react-native-svg-transformer
                
                
            ], 
            resolve: {
                alias: {
                    'react-native-safe-area-context': 'react-native-web-safe-area-context',
                    'react-native-permissions': 'react-native-web/dist/exports/View',
                    'react-native-ble-manager': 'react-native-web/dist/exports/View',
                    'react-native-linear-gradient': 'react-native-web/dist/exports/View',
                    'react-native-zip-archive':'react-native-web/dist/exports/View',
                    'react-native-fs':'react-native-web/dist/exports/View',
                    '@settings':'react-native-web/dist/exports/View',
                },
            },
        });

        // config.resolve.alias = {
        //     ...config.resolve.alias,
        //     'react-native-safe-area-context': 'react-native-web-safe-area-context',
        // };
        // return config;
    },
};


export default config;