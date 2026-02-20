import type { StorybookConfig } from '@storybook/react-native-web-vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { mergeConfig } from 'vite';
import svgr from 'vite-plugin-svgr';
import { nodePolyfills } from 'vite-plugin-node-polyfills'; 
import { fileURLToPath } from 'node:url';


import path from 'path';
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));



const config: StorybookConfig = {
    stories: [
        "../src/components/**/*.stories.@(js|jsx|mjs|ts|tsx)",
        "../src/pages/**/*.stories.@(js|jsx|mjs|ts|tsx)"
    ],
    
    addons: ['@storybook/addon-docs'],
    framework: "@storybook/react-native-web-vite",

    viteFinal: async (config: any) => {
        return mergeConfig(config, {
            plugins: [
                tsconfigPaths(),
                svgr({ include: "**/*.svg" }),

                nodePolyfills({
                    protocolImports: true,
                }),
            ],

            resolve: {
                alias: {
                    'react-native-safe-area-context': 'react-native-web-safe-area-context',
                    'react-native-permissions': 'react-native-web/dist/exports/View',
                    'react-native-ble-manager': 'react-native-web/dist/exports/View',
                    'react-native-linear-gradient': 'react-native-web/dist/exports/View',
                    'react-native-zip-archive': 'react-native-web/dist/exports/View',
                    'react-native-fs': 'react-native-web/dist/exports/View',
                    '@settings': 'react-native-web/dist/exports/View',
                    crypto: path.resolve(dirname, './cryptoStub.ts'),
                    'node:crypto': path.resolve(dirname, './cryptoStub.ts'),
                    'incyclist-services': path.resolve(dirname, '../../services/lib/esm/index.js'),
                    'incyclist-devices': path.resolve(dirname, '../../devices/lib/esm/index.js')

                },
            },

            define: {
                global: 'globalThis',
                'process.env': {}, // prevents process-related crashes
            },

            optimizeDeps: {
                include: [
                    'buffer', 'process',
                ],
                exclude: [
                    'incyclist-services',
                    'incyclist-devices',
                ] 
            },
            ssr: {
            exclude: [
                'incyclist-services' ,
                'incyclist-devices' 
                ] 
            }
        });
    },
};

export default config;