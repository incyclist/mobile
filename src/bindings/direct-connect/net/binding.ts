import TcpSocket from 'react-native-tcp-socket';
import type { NetBinding, Socket } from '../types';
import {EventEmitter} from 'events';

class RNSocket extends EventEmitter implements Socket  {
    private socket: TcpSocket.Socket|undefined

    constructor() {
        super()
        this.socket = new TcpSocket.Socket();
    }

    connect(port:number, host:string):Socket {
        this.socket?.on('data', data => this.emit('data', data))

        // The native socket's own listener isn't removed until destroy() tears it down, so
        // a late/duplicate native error (e.g. arriving during/after teardown) can still reach
        // here after a caller has already cleared its listeners with removeAllListeners().
        // Unlike the native socket's eventemitter3, this class extends Node's EventEmitter,
        // which throws on emit('error', ...) when nobody is listening - only forward when
        // someone actually is, so a stray late error is dropped instead of crashing the app.
        this.socket?.on('error', err => {
            if (this.listenerCount('error') > 0)
                this.emit('error', err)
        })
        this.socket?.on('close', () => this.emit('close'))


        this.socket?.connect({host,port},()=>{
              this.emit('connect')
        }) as unknown as Socket
        return this
    }

    destroy() {
        this.socket?.destroy()
        delete this.socket
    }

    write(data:Buffer):boolean {
        return this.socket?.write(data)??false
    }


}

export class ReactNativeNetBinding implements NetBinding {
    createSocket(): Socket {
       
        // We cast/wrap because the library is 99% compatible with your interface
        return new RNSocket()
    }
}
