import { EventLogger } from 'gd-eventlog'
import Zeroconf from 'react-native-zeroconf'
import type { BrowserConfig, MulticastDnsAnnouncement, MulticastDnsBinding } from '../types'

const SCAN_WINDOW = 5000 // total time for one full round over all browsers (ms)

type BrowserEntry = {
    key: string
    type: string
    protocol: string
    domain: string
    browser: Zeroconf
    onup?: (svc: MulticastDnsAnnouncement) => void
}

export class ReactNativeMdnsBinding implements MulticastDnsBinding {
    private _logger!: EventLogger
    private _connected: boolean = false
    private readonly browsers: Map<string, BrowserEntry> = new Map()
    private rotationTimer?: ReturnType<typeof setTimeout>
    private activeKey?: string

    /**
     * Idempotent: the trainer discovery and the link watch both call it, and neither may reset the
     * browsers the other has registered. Release browsers with {@link stopFind} (one type) or
     * {@link disconnect} (all).
     */
    connect(): void {
        try {
            if (this._connected)
                return
            this._connected = true
            this.logger.logEvent({ message: 'Connect to bonjour ' })
        }
        catch (err: any) {
            this.logError(err, 'connect')
        }
    }

    disconnect(): void {
        try {
            if (this._connected) {
                this.logger.logEvent({ message: 'Disconnect from bonjour ' })
            }

            this.stopRotation()

            this.browsers.forEach(entry => {
                try {
                    entry.browser.stop()
                    entry.browser.removeAllListeners()
                }
                catch (err: any) {
                    this.logError(err, 'disconnect')
                }
            })
        }
        catch (err: any) {
            this.logError(err, 'disconnect')
        }
        finally {
            this.browsers.clear()
            this.activeKey = undefined
            this._connected = false
        }
    }

    /**
     * Find services on the network with options
     * @param opts BrowserConfig
     * @param onup Callback when service up event received
     */
    find(opts: BrowserConfig | null, onup?: (svc: MulticastDnsAnnouncement) => void) {

        if (!this._connected) return

        // no support for wildcard search
        if (!opts?.type)
            return

        try {
            const type = opts.type ?? 'directconnect'
            const protocol = opts.protocol ?? 'tcp'
            const domain = 'local.'

            const key = `${type}:${protocol}:${domain}`
            let entry = this.browsers.get(key)
            const isNew = !entry

            if (!entry) {
                this.logger.logEvent({ message: 'create new scanner', type })
                entry = { key, type, protocol, domain, browser: new Zeroconf(), onup }
                this.browsers.set(key, entry)
                this.attachListener(entry)
            }
            else if (onup) {
                entry.onup = onup
            }

            // an existing browser must not restart a scan that is already running (idempotent re-arm)
            if (isNew || (!this.activeKey && !this.rotationTimer))
                this.startRotation()
        }
        catch (err: any) {
            this.logError(err, 'find')
        }
    }

    /**
     * Stops the browser of one service type and leaves all other browsers (and the connection) alone.
     * Safe to call for a type that is not browsed.
     * @param type service type as passed to find()
     * @param protocol defaults to 'tcp'
     */
    stopFind(type: string, protocol: 'tcp' | 'udp' = 'tcp'): void {
        try {
            const key = `${type}:${protocol}:local.`
            const entry = this.browsers.get(key)
            if (!entry)
                return

            const wasActive = this.activeKey === key
            this.browsers.delete(key)
            try {
                entry.browser.stop()
                entry.browser.removeAllListeners()
            }
            catch (err: any) {
                this.logError(err, 'stopFind')
            }

            if (wasActive)
                this.activeKey = undefined

            if (this.browsers.size === 0) {
                this.stopRotation()
                return
            }
            // the slice that was running ended with its browser: continue with the next one right away
            if (wasActive) {
                if (this.rotationTimer) {
                    clearTimeout(this.rotationTimer)
                    this.rotationTimer = undefined
                }
                this.scanNext()
            }
        }
        catch (err: any) {
            this.logError(err, 'stopFind')
        }
    }

    /**
     * Registers the 'resolved' listener exactly once per browser.
     * The callback is looked up on the entry, so a later find() can replace it
     * without adding duplicate listeners.
     */
    protected attachListener(entry: BrowserEntry) {
        const { type, protocol, domain, browser } = entry

        browser.on('resolved', (service: any) => {
            try {
                if (!service?.addresses?.length) return

                this.logger.logEvent({ message: 'got announcement', type, protocol, domain, service })

                const announcement: MulticastDnsAnnouncement = {
                    type,
                    address: service.addresses[0],
                    port: service.port,
                    name: service.name,
                    serialNo: service.txt?.serialNo,
                    serviceUUIDs: service.txt?.['ble-service-uuids']?.split(','),
                    transport: 'tcp'
                }

                entry.onup?.(announcement)
            }
            catch (err: any) {
                this.logError(err, 'onResolved')
            }
        })

        // an 'error' event without a listener would throw inside the native event handler
        browser.on('error', (err: any) => {
            this.logError(err, 'onBrowserError')
        })
    }

    /**
     * Starts the rotation if it is not running yet. If it is already running,
     * the new browser is simply picked up on the next tick (the slice length is
     * recalculated on every tick).
     */
    protected startRotation() {
        if (this.rotationTimer) return
        this.scanNext()
    }

    protected stopRotation() {
        if (this.rotationTimer) {
            clearTimeout(this.rotationTimer)
            this.rotationTimer = undefined
        }
        this.stopActive()
    }

    protected stopActive() {
        if (!this.activeKey) return
        const active = this.browsers.get(this.activeKey)
        this.activeKey = undefined
        try {
            active?.browser.stop()
        }
        catch (err: any) {
            this.logError(err, 'stopActive')
        }
    }

    /**
     * Stops the currently active scan, starts the next browser in line
     * and schedules the following switch.
     */
    protected scanNext() {
        this.rotationTimer = undefined

        if (!this._connected || this.browsers.size === 0) return

        try {
            const entries = Array.from(this.browsers.values())
            const idx = entries.findIndex(e => e.key === this.activeKey)
            const next = entries[(idx + 1) % entries.length]  // idx=-1 -> first entry

            this.stopActive()

            this.activeKey = next.key
            this.logger.logEvent({ message: 'start scan', type: next.type, protocol: next.protocol, domain: next.domain })
            // Note: scan() cancels any prior scan on the same browser on both platforms,
            // which is why only one browser is scanned at a time (see stopActive above)
            next.browser.scan(next.type, next.protocol, next.domain)

            // with a single browser there is nothing to alternate with
            if (entries.length > 1) {
                const slice = SCAN_WINDOW / entries.length
                this.rotationTimer = setTimeout(() => this.scanNext(), slice)
            }
        }
        catch (err: any) {
            this.logError(err, 'scanNext')
        }
    }

    protected get logger(): EventLogger {
        this._logger = this._logger ?? new EventLogger('DirectConnect')
        return this._logger
    }

    protected logError(err: any, fn: string) {
        try {
            this.logger.logEvent({ message: 'error', fn, error: err?.message ?? String(err), stack: err?.stack })
        }
        catch {
            // nothing left to report to
        }
    }
}