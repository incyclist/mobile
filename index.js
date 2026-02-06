import 'react-native-get-random-values'; // Must be the very first line
import { AppRegistry } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { name as appName } from './app.json';
import { Buffer } from "buffer"

global.Buffer = Buffer

/*
const EventEmitter = require('events');
if (!EventEmitter.default) {
  EventEmitter.default = EventEmitter;
}

if (typeof Buffer === 'undefined') {
  global.Buffer = require('buffer').Buffer;
}
if (typeof process === 'undefined') {
  global.process = require('process');
}

// Ensure process.nextTick exists (often used by EventEmitters)
if (!global.process.nextTick) {
  global.process.nextTick = setImmediate;
}
*/


import { Shell } from './src/Shell.tsx';

const Root = () => (
  <SafeAreaProvider>
    <Shell />
  </SafeAreaProvider>
);
AppRegistry.registerComponent(appName, () => Root);
