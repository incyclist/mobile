import { EventEmitter } from 'events'

// react-native-tcp-socket's real Socket is itself an EventEmitter (eventemitter3) driven by
// native events. A plain EventEmitter stand-in lets the test fire a native 'error' event on
// demand, exactly as the native module would.
class FakeNativeSocket extends EventEmitter {
    connect = jest.fn()
    write = jest.fn()
    destroy = jest.fn()
}

let mockNativeSocket: FakeNativeSocket

jest.mock('react-native-tcp-socket', () => ({
    Socket: jest.fn().mockImplementation(() => mockNativeSocket),
}))

import { ReactNativeNetBinding } from './binding'

describe('ReactNativeNetBinding / RNSocket', () => {
    beforeEach(() => {
        mockNativeSocket = new FakeNativeSocket()
    })

    // Reproduces uuid 36076c16-ab75-4adc-b4f8-68bad6381faa's production crash
    // ("crash in main window" / "Unhandled error. (undefined)"): a late 'error' event from
    // the underlying native socket - arriving after the wrapper's own listeners were cleared
    // via removeAllListeners(), as peripheral.ts's stopConnection()/onPortClose() do - reaches
    // a listener-less EventEmitter and throws instead of being swallowed.
    it('does not throw when the native socket emits a late error after removeAllListeners()', () => {
        const socket = new ReactNativeNetBinding().createSocket()
        socket.connect(5000, '192.168.1.50')

        socket.on('error', () => { /* consumer's own handler, mirrors peripheral.ts */ })
        socket.removeAllListeners()

        expect(() => {
            mockNativeSocket.emit('error', { code: 'ECONNRESET' })
        }).not.toThrow()
    })

    it('forwards data/error/close/connect events from the native socket while listeners are attached', () => {
        const socket = new ReactNativeNetBinding().createSocket()
        socket.connect(5000, '192.168.1.50')

        const onData = jest.fn()
        const onError = jest.fn()
        const onClose = jest.fn()
        socket.on('data', onData)
        socket.on('error', onError)
        socket.on('close', onClose)

        mockNativeSocket.emit('data', Buffer.from('hi'))
        mockNativeSocket.emit('error', new Error('boom'))
        mockNativeSocket.emit('close')

        expect(onData).toHaveBeenCalledWith(Buffer.from('hi'))
        expect(onError).toHaveBeenCalledWith(new Error('boom'))
        expect(onClose).toHaveBeenCalled()
    })
})
