import 'react-native-get-random-values'; // Must be the very first line
import { AppRegistry } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { name as appName } from './app.json';
import { Buffer } from "buffer"


// Polyfill Buffer
global.Buffer = Buffer

// Polyfill Process/nextTick
if (typeof process === 'undefined') {
  global.process = require('process');
}
if (!process.nextTick) {
  global.process = global.process || {};
  global.process.nextTick = setImmediate;
}

// Polyfill TextEncoder/Decoder (The Protobuf Fix)
// We import specifically from sinonjs to handle the {fatal: true} option
import { TextEncoder, TextDecoder } from '@sinonjs/text-encoding';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

if (typeof structuredClone==='undefined') {
    global.structuredClone = (o)=> {
        try {
            return JSON.parse(JSON.stringify(o))
        } catch  {}
    }
}

/* required of default exports of events are used
const EventEmitter = require('events');
if (!EventEmitter.default) {
  EventEmitter.default = EventEmitter;
}
*/


import { Loader } from './src/Loader.tsx';

const Root = () => (
  <SafeAreaProvider>
    <Loader />
  </SafeAreaProvider>
);
AppRegistry.registerComponent(appName, () => Root);
