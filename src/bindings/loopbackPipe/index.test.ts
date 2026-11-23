import { EventEmitter } from 'events'

const mockLogEvent = jest.fn()
jest.mock('gd-eventlog', () => ({
    EventLogger: jest.fn().mockImplementation(() => ({ logEvent: mockLogEvent })),
}))

class MockSocket extends EventEmitter {
    written: any[] = []
    destroyed = false
    ended = false
    paused = false
    writeResult = true
    write = jest.fn((d: any) => { this.written.push(d); return this.writeResult })
    pause = jest.fn(() => { this.paused = true })
    resume = jest.fn(() => { this.paused = false })
    end = jest.fn(() => { this.ended = true })
    destroy = jest.fn(() => { this.destroyed = true; this.emit('close') })
}

class MockServer extends EventEmitter {
    listenArgs: any
    closed = false
    port = 40001 + mockState.servers.length
    onConnection: (s: MockSocket) => void
    constructor(cb: (s: MockSocket) => void) { super(); this.onConnection = cb }
    listen = jest.fn((opts: any, cb: () => void) => { this.listenArgs = opts; cb() })
    address = jest.fn(() => ({ port: this.port }))
    close = jest.fn(() => { this.closed = true; this.emit('close') })
}

const mockState: { servers: MockServer[]; upstreams: MockSocket[]; connectCalls: any[]; autoConnect: boolean } =
    { servers: [], upstreams: [], connectCalls: [], autoConnect: true }

jest.mock('react-native-tcp-socket', () => ({
    __esModule: true,
    default: {
        createServer: (cb: any) => { const s = new MockServer(cb); mockState.servers.push(s); return s },
        createConnection: (opts: any, cb: () => void) => {
            const u = new MockSocket()
            mockState.upstreams.push(u)
            mockState.connectCalls.push(opts)
            if (mockState.autoConnect) setImmediate(cb)
            else (u as any).connectCb = cb
            return u
        },
    },
}))

import { LoopbackPipeBinding, MAX_CONNECTIONS, CONNECT_TIMEOUT_MS } from './index'

const tick = () => new Promise((r) => setImmediate(r))

describe('LoopbackPipeBinding', () => {
    let binding: LoopbackPipeBinding
    const opts = { upstreamHost: '10.0.0.5', upstreamPort: 7000 }

    const accept = async (server: MockServer) => {
        const client = new MockSocket()
        server.onConnection(client)
        await tick()
        return client
    }

    beforeEach(() => {
        jest.clearAllMocks()
        mockState.servers = []
        mockState.upstreams = []
        mockState.connectCalls = []
        mockState.autoConnect = true
        binding = new LoopbackPipeBinding()
    })

    test('listens on 127.0.0.1 only and returns the port', async () => {
        const res = await binding.start(opts)
        expect(res).toEqual({ port: 40001 })
        expect(mockState.servers[0].listenArgs.host).toBe('127.0.0.1')
    })

    test('copies bytes in both directions to the fixed upstream', async () => {
        await binding.start(opts)
        const client = await accept(mockState.servers[0])
        const up = mockState.upstreams[0]
        expect(mockState.connectCalls[0]).toEqual({ host: '10.0.0.5', port: 7000 })
        client.emit('data', 'req')
        up.emit('data', 'resp')
        expect(up.written).toEqual(['req'])
        expect(client.written).toEqual(['resp'])
        expect(client.paused).toBe(false)
    })

    test('holds client bytes back until the upstream is connected', async () => {
        mockState.autoConnect = false
        await binding.start(opts)
        const client = new MockSocket()
        mockState.servers[0].onConnection(client)
        expect(client.paused).toBe(true)
        ;(mockState.upstreams[0] as any).connectCb()
        expect(client.paused).toBe(false)
    })

    test('handles 8 concurrent connections independently', async () => {
        await binding.start(opts)
        const clients: MockSocket[] = []
        for (let i = 0; i < 8; i++) clients.push(await accept(mockState.servers[0]))
        clients.forEach((c, i) => c.emit('data', `m${i}`))
        mockState.upstreams.forEach((u, i) => expect(u.written).toEqual([`m${i}`]))
    })

    test('refuses connections beyond the limit', async () => {
        await binding.start(opts)
        for (let i = 0; i < MAX_CONNECTIONS; i++) await accept(mockState.servers[0])
        const extra = await accept(mockState.servers[0])
        expect(extra.destroyed).toBe(true)
        expect(mockState.upstreams).toHaveLength(MAX_CONNECTIONS)
    })

    test('applies backpressure with pause and drain', async () => {
        await binding.start(opts)
        const client = await accept(mockState.servers[0])
        const up = mockState.upstreams[0]
        up.writeResult = false
        client.emit('data', 'x')
        expect(client.paused).toBe(true)
        up.emit('drain')
        expect(client.paused).toBe(false)
    })

    test('closing the client destroys the upstream', async () => {
        await binding.start(opts)
        const client = await accept(mockState.servers[0])
        client.emit('close')
        expect(mockState.upstreams[0].destroyed).toBe(true)
    })

    test('closing or failing the upstream destroys the client', async () => {
        await binding.start(opts)
        const c1 = await accept(mockState.servers[0])
        const c2 = await accept(mockState.servers[0])
        mockState.upstreams[0].emit('close')
        mockState.upstreams[1].emit('error', new Error('boom'))
        expect(c1.destroyed).toBe(true)
        expect(c2.destroyed).toBe(true)
        expect(mockLogEvent).toHaveBeenCalledWith(expect.objectContaining({ error: 'boom' }))
    })

    test('an end on one side ends the other side', async () => {
        await binding.start(opts)
        const client = await accept(mockState.servers[0])
        mockState.upstreams[0].emit('end')
        expect(client.ended).toBe(true)
    })

    test('upstream connect timeout closes the client', async () => {
        jest.useFakeTimers()
        try {
            mockState.autoConnect = false
            await binding.start(opts)
            const client = new MockSocket()
            mockState.servers[0].onConnection(client)
            jest.advanceTimersByTime(CONNECT_TIMEOUT_MS + 1)
            expect(client.destroyed).toBe(true)
            expect(mockState.upstreams[0].destroyed).toBe(true)
        } finally {
            jest.useRealTimers()
        }
    })

    test('stop(port) closes that server and its connections only', async () => {
        await binding.start(opts)
        await binding.start(opts)
        const c1 = await accept(mockState.servers[0])
        const c2 = await accept(mockState.servers[1])
        await binding.stop(40001)
        expect(mockState.servers[0].closed).toBe(true)
        expect(c1.destroyed).toBe(true)
        expect(mockState.servers[1].closed).toBe(false)
        expect(c2.destroyed).toBe(false)
    })

    test('stop() without a port closes everything', async () => {
        await binding.start(opts)
        const c1 = await accept(mockState.servers[0])
        await binding.stop()
        expect(mockState.servers[0].closed).toBe(true)
        expect(c1.destroyed).toBe(true)
        expect(mockState.upstreams[0].destroyed).toBe(true)
    })

    describe('never throws', () => {
        test('start resolves with port 0 when listen throws', async () => {
            const lib = require('react-native-tcp-socket').default
            const orig = lib.createServer
            lib.createServer = (cb: any) => { const s = orig(cb); s.listen = () => { throw new Error('nope') }; return s }
            try {
                await expect(binding.start(opts)).resolves.toEqual({ port: 0 })
            } finally {
                lib.createServer = orig
            }
        })

        test('start resolves with port 0 on a server error event', async () => {
            const lib = require('react-native-tcp-socket').default
            const orig = lib.createServer
            lib.createServer = (cb: any) => { const s = orig(cb); s.listen = () => { setImmediate(() => s.emit('error', new Error('in use'))) }; return s }
            try {
                await expect(binding.start(opts)).resolves.toEqual({ port: 0 })
            } finally {
                lib.createServer = orig
            }
        })

        test('start resolves with port 0 when createServer throws', async () => {
            const lib = require('react-native-tcp-socket').default
            const orig = lib.createServer
            lib.createServer = () => { throw new Error('native missing') }
            try {
                await expect(binding.start(opts)).resolves.toEqual({ port: 0 })
            } finally {
                lib.createServer = orig
            }
        })

        test('throwing socket writes, destroys and closes do not escape', async () => {
            await binding.start(opts)
            const client = await accept(mockState.servers[0])
            const up = mockState.upstreams[0]
            up.write.mockImplementation(() => { throw new Error('write failed') })
            client.destroy.mockImplementation(() => { throw new Error('destroy failed') })
            up.destroy.mockImplementation(() => { throw new Error('destroy failed') })
            expect(() => client.emit('data', 'x')).not.toThrow()
            expect(() => up.emit('end')).not.toThrow()
            mockState.servers[0].close.mockImplementation(() => { throw new Error('close failed') })
            await expect(binding.stop()).resolves.toBeUndefined()
        })

        test('a throwing createConnection closes the client', async () => {
            const lib = require('react-native-tcp-socket').default
            const orig = lib.createConnection
            lib.createConnection = () => { throw new Error('no connect') }
            try {
                await binding.start(opts)
                const client = await accept(mockState.servers[0])
                expect(client.destroyed).toBe(true)
            } finally {
                lib.createConnection = orig
            }
        })

        test('a throwing logger does not escape', async () => {
            mockLogEvent.mockImplementation(() => { throw new Error('log failed') })
            try {
                await binding.start(opts)
                const client = await accept(mockState.servers[0])
                expect(() => mockState.upstreams[0].emit('error', new Error('x'))).not.toThrow()
                expect(client.destroyed).toBe(true)
            } finally {
                mockLogEvent.mockReset()
            }
        })

        test('stop of an unknown port is a no-op', async () => {
            await expect(binding.stop(1)).resolves.toBeUndefined()
        })
    })
})
