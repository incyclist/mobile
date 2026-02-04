// metro.config.js
const path = require('path');
const fs = require('fs'); 
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

// 1. Define the path to your library source
const servicesPath = path.resolve(__dirname, '../services/lib/esm');
const devicesPath = path.resolve(__dirname, '../devices/lib/esm');

// 2. Check if folder exists AND we are in dev mode
const isDev = process.env.APP_VARIANT === 'debug' || process.env.APP_VARIANT === 'dev'
const canUseLocalServicesLib = isDev && fs.existsSync(servicesPath);
const canUseLocalDevicesLib  = isDev && fs.existsSync(devicesPath);


console.log('# ISDEV', isDev)
console.log('# SERVICES', canUseLocalServicesLib ?  servicesPath : false)
console.log('# DEVICES', canUseLocalDevicesLib ? devicesPath : false)

const watchFolders = []
const blockList = [
    // /node_modules\/uuid\/.*/
] 

if (canUseLocalServicesLib)  {
    blockList.push(/node_modules\/incyclist-services\/.*/)
    watchFolders.push(servicesPath)
}
if (canUseLocalDevicesLib)  {
    blockList.push(/node_modules\/incyclist-devices\/.*/)
    watchFolders.push(devicesPath)
}

const settingsPath = (isDev)
  ? path.resolve(__dirname, `config/${process.env.APP_VARIANT }/settings.json`)
  : path.resolve(__dirname, 'polyfill/settings.ts');

/**
 * Metro configuration
 * 
 
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
    watchFolders,
    resolver: {
        blockList,
        extraNodeModules: new Proxy({
            'incyclist-ant-plus': path.resolve(__dirname, 'polyfill/node-mocks.js'),
            '@serialport/stream': path.resolve(__dirname, 'polyfill/node-mocks.js'),
            'events': path.resolve(__dirname, 'node_modules/events'),
            'node:events':path.resolve(__dirname, 'node_modules/events'),
            'serialport': path.resolve(__dirname, 'polyfill/node-mocks.js'), // FIXED: was empty-module
            'fs': path.resolve(__dirname, 'polyfill/node-mocks.js'),
            'stream': path.resolve(__dirname, 'polyfill/node-mocks.js'),     // FIXED: was empty-module
            '@settings' : settingsPath,

            // Logic-only mocks can stay as empty-module
            'path': require.resolve('metro-runtime/src/modules/empty-module.js'),
            'crypto': require.resolve('metro-runtime/src/modules/empty-module.js'),
            'net': require.resolve('metro-runtime/src/modules/empty-module.js'),
            'os': require.resolve('metro-runtime/src/modules/empty-module.js'),
            'timers': require.resolve('metro-runtime/src/modules/empty-module.js'),
            
            'process': require.resolve('process/browser'),
            'buffer': require.resolve('buffer'),  
            ...(canUseLocalServicesLib ? { 'incyclist-services': servicesPath } : {}),            
            ...(canUseLocalDevicesLib ? { 'incyclist-devices': devicesPath } : {}),            
        }, {
        get: (target,name) =>  {
            return name in target ? target[name] : path.join(process.cwd(), `node_modules/${name}`)
            }            
        })
    },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
