import type { StorybookConfig } from '@storybook/react-native-web-vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { mergeConfig } from 'vite';
import svgr from 'vite-plugin-svgr';
import { fileURLToPath } from 'node:url';
import path from 'path';

const dirname = typeof __dirname !== 'undefined'
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
    stories: [
        '../src/components/**/*.stories.@(js|jsx|mjs|ts|tsx)',
        '../src/pages/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    ],

    addons: ['@storybook/addon-docs'],
    framework: '@storybook/react-native-web-vite',

    viteFinal: async (config: any) => {
        return mergeConfig(config, {
            plugins: [
                tsconfigPaths(),
                svgr({ include: '**/*.svg' }),

                // Inject Buffer as a true global at the bundler level.
                //
                // Why not preview.ts: ES module imports are hoisted and evaluated
                // before any code in the file runs. incyclist-services/devices crash
                // on Buffer before preview.ts body executes.
                //
                // Why not define{}: Vite define only does string replacement.
                // Array syntax like Buffer:['buffer','Buffer'] serializes to the
                // literal string "buffer,Buffer" - not a constructor.
                //
                // This plugin (enforce:'pre') transforms every module before Vite
                // processes it, prepending the Buffer import so it is defined
                // before any module body runs - including inside node_modules.
                {
                    name: 'buffer-global-inject',
                    enforce: 'pre' as const,
                    transform(code: string, id: string) {
                        if (!id.match(/\.[jt]sx?$/)) return null;
                        if (code.includes("from 'buffer'")) return null;
                        if (code.includes('from "buffer"')) return null;
                        if (code.includes("require('buffer')")) return null;
                        if (code.includes('require("buffer")')) return null;
                        if (code.includes('globalThis.Buffer')) return null;
                        return {
                            code: `import { Buffer } from 'buffer';\nif (typeof globalThis.Buffer === 'undefined') globalThis.Buffer = Buffer;\n${code}`,
                            map: null,
                        };
                    },
                },

                // nodePolyfills() is intentionally omitted.
                // It pulls in crypto-browserify -> browserify-sign, which vendors
                // its own readable-stream and crashes at module init time in Vite
                // (Buffer.prototype.slice undefined before polyfills are applied).
                // Each Node built-in is aliased explicitly below, mirroring metro.config.js.
            ],

            resolve: {
                alias: {
                    // ── React Native web shims ────────────────────────────────────
                    'react-native-safe-area-context': 'react-native-web-safe-area-context',
                    'react-native-permissions':      'react-native-web/dist/exports/View',
                    'react-native-ble-manager':      'react-native-web/dist/exports/View',
                    'react-native-linear-gradient':  'react-native-web/dist/exports/View',
                    'react-native-zip-archive':      'react-native-web/dist/exports/View',
                    '@react-native-documents/picker': path.resolve(dirname, './documentPickerStub.ts'),
                    'react-native-video': path.resolve(dirname, './mocks/react-native-video.tsx'),
                    //'react-native-fs':               'react-native-web/dist/exports/View',
                    'react-native-fs': path.resolve(dirname, './emptyStub.ts'),
                    '@settings':                     'react-native-web/dist/exports/View',

                    // ── crypto: stub (never use crypto-browserify) ────────────────
                    // crypto-browserify -> browserify-sign -> vendored readable-stream
                    // crashes at module init. Crypto ops go through ICryptoBinding instead.
                    'crypto':            path.resolve(dirname, './cryptoStub.ts'),
                    'node:crypto':       path.resolve(dirname, './cryptoStub.ts'),
                    'crypto-browserify': path.resolve(dirname, './cryptoStub.ts'),
                    'ripemd160':         path.resolve(dirname, './cryptoStub.ts'),
                    'browserify-sign':   path.resolve(dirname, './cryptoStub.ts'),

                    // ── events: browser-safe implementation (already installed) ───
                    'events':      path.resolve(dirname, '../node_modules/events'),
                    'node:events': path.resolve(dirname, '../node_modules/events'),

                    // ── stream: browser-safe (needed by @serialport parsers) ──────
                    'stream':      path.resolve(dirname, '../node_modules/stream-browserify'),
                    'node:stream': path.resolve(dirname, '../node_modules/stream-browserify'),

                    // ── os: browser-safe implementation ──────────────────────────
                    'os':      path.resolve(dirname, '../node_modules/os-browserify'),
                    'node:os': path.resolve(dirname, '../node_modules/os-browserify'),

                    // ── other Node built-ins: empty stubs ────────────────────────
                    // Imported by incyclist-services/devices but not called in Storybook.
                    'fs':                 path.resolve(dirname, './emptyStub.ts'),
                    'path':               path.resolve(dirname, './emptyStub.ts'),
                    'node:path':          path.resolve(dirname, './emptyStub.ts'),
                    'net':                path.resolve(dirname, './emptyStub.ts'),
                    'timers':             path.resolve(dirname, './emptyStub.ts'),
                    'serialport':         path.resolve(dirname, './emptyStub.ts'),
                    '@serialport/stream': path.resolve(dirname, './emptyStub.ts'),

                    // ── process & buffer: proper browser implementations ──────────
                    'process': path.resolve(dirname, '../node_modules/process/browser.js'),
                    'buffer':  path.resolve(dirname, '../node_modules/buffer'),

                    // ── incyclist libraries ───────────────────────────────────────
                    'incyclist-services': path.resolve(dirname, '../../services/lib/esm/index.js'),
                    'incyclist-devices':  path.resolve(dirname, '../../devices/lib/esm/index.js'),
                },
            },

            define: {
                global: 'globalThis',
                'process.env': {},
            },

            optimizeDeps: {
                include: ['buffer', 'process'],
                exclude: ['incyclist-services', 'incyclist-devices'],
            },

            ssr: {
                exclude: ['incyclist-services', 'incyclist-devices'],
            },
        });
    },
};

export default config;
