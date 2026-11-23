import * as net from 'node:net'

jest.mock('gd-eventlog', () => ({
    EventLogger: jest.fn().mockImplementation(() => ({ logEvent: jest.fn() })),
}))

// thin adapter: react-native-tcp-socket API on top of real node sockets
jest.mock('react-native-tcp-socket', () => {
    const nodeNet = require('node:net')
    return {
        __esModule: true,
        default: {
            createServer: (cb: any) => nodeNet.createServer(cb),
            createConnection: (opts: any, cb: () => void) => nodeNet.createConnection(opts, cb),
        },
    }
})

import { LoopbackPipeBinding } from './index'

const listen = (server: net.Server): Promise<number> =>
    new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve((server.address() as net.AddressInfo).port)))

const connect = (port: number): Promise<net.Socket> =>
    new Promise((resolve, reject) => {
        const s = net.createConnection({ host: '127.0.0.1', port }, () => resolve(s))
        s.once('error', reject)
    })

const request = (port: number, payload: string): Promise<string> =>
    new Promise((resolve, reject) => {
        const s = net.createConnection({ host: '127.0.0.1', port }, () => s.write(payload))
        let got = ''
        s.on('data', (d) => (got += d.toString()))
        s.on('end', () => resolve(got))
        s.on('error', reject)
    })

describe('LoopbackPipeBinding with real sockets', () => {
    let upstream: net.Server
    let upstreamPort: number
    let upstreamSockets: net.Socket[]
    let binding: LoopbackPipeBinding

    beforeEach(async () => {
        upstreamSockets = []
        upstream = net.createServer((s) => {
            upstreamSockets.push(s)
            s.on('data', (d) => s.end(`echo:${d.toString()}`))
            s.on('error', () => undefined)
        })
        upstreamPort = await listen(upstream)
        binding = new LoopbackPipeBinding()
    })

    afterEach(async () => {
        await binding.stop()
        upstreamSockets.forEach((s) => s.destroy())
        await new Promise((r) => upstream.close(r))
    })

    test('forwards a request and its response, 10 connections at once', async () => {
        const { port } = await binding.start({ upstreamHost: '127.0.0.1', upstreamPort })
        expect(port).toBeGreaterThan(0)
        const results = await Promise.all(Array.from({ length: 10 }, (_, i) => request(port, `hello${i}`)))
        results.forEach((r, i) => expect(r).toBe(`echo:hello${i}`))
    })

    test('moves a large payload unchanged', async () => {
        const big = Buffer.alloc(3 * 1024 * 1024, 'a').toString()
        const sink = net.createServer((s) => {
            let n = 0
            s.on('data', (d) => { n += d.length; if (n >= big.length) s.end(String(n)) })
        })
        const sinkPort = await listen(sink)
        try {
            const { port } = await binding.start({ upstreamHost: '127.0.0.1', upstreamPort: sinkPort })
            expect(await request(port, big)).toBe(String(big.length))
        } finally {
            await new Promise((r) => sink.close(r))
        }
    })

    test('closes the client when the upstream is unreachable', async () => {
        const dead = net.createServer()
        const deadPort = await listen(dead)
        await new Promise((r) => dead.close(r))
        const { port } = await binding.start({ upstreamHost: '127.0.0.1', upstreamPort: deadPort })
        const client = await connect(port)
        await new Promise((r) => client.once('close', r))
    })

    test('stop closes open client connections and the listener', async () => {
        const { port } = await binding.start({ upstreamHost: '127.0.0.1', upstreamPort })
        const client = await connect(port)
        await new Promise((r) => setTimeout(r, 50))
        const closed = new Promise((r) => client.once('close', r))
        await binding.stop(port)
        await closed
        await expect(connect(port)).rejects.toBeDefined()
    })
})
