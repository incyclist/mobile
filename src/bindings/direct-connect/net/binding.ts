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
        this.socket?.on('error', err => this.emit('error', err))
        this.socket?.on('close', () => this.emit('close'))


        this.socket?.connect({host,port},()=>{
              this.emit('connect')
        }) as unknown as Socket
        return this
    }

    destroy() {
        this.socket?.destroy
        delete this.socket
    }

    write(data:Buffer):boolean {
        return this.socket?.write(data)??false
    }


}

export class ReactNativeNetBinding implements NetBinding {
    createSocket(): Socket {

        

        
        console.log('[Socket]creat Socket =>')
        
        // We cast/wrap because the library is 99% compatible with your interface
        return new RNSocket()
    }
}
