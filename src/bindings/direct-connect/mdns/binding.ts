import { EventLogger } from 'gd-eventlog'
import Zeroconf from 'react-native-zeroconf'
import type { BrowserConfig, MulticastDnsAnnouncement, MulticastDnsBinding } from '../types'

// react-native-zeroconf only supports one active scan, so the browsers take turns
const BROWSER_ROTATION_INTERVAL = 5000 // ms

type Browser = {
    type: string
    protocol: 'tcp' | 'udp'
    callbacks: Array<(svc: MulticastDnsAnnouncement) => void>
}

export class ReactNativeMdnsBinding  implements MulticastDnsBinding{
    private bonjour:Zeroconf|undefined
    private _logger!: EventLogger
    private browsers: Browser[] = []
    private activeBrowser: Browser|undefined
    private rotationTimer: ReturnType<typeof setInterval>|undefined

    connect():void {            
        try {
            console.log('[DirectConnect].connect')
            if (!this.bonjour) {
                this.bonjour = new Zeroconf()
                this.bonjour.on('resolved', this.onResolved.bind(this))

                this.logger.logEvent( {message:'Connect to bonjour '})
            }
            return;

        }
        catch(err:any) {
            this.logError(err,'connect')
        }
    }

    protected get logger():EventLogger {
        this._logger = this._logger??new EventLogger('DirectConnect')
        return this._logger
    }

    protected logError(err:any,fn:string) {
        this.logger.logEvent({message:'error', fn, error:err.message, stack:err.stack})
    }

    disconnect():void {
        try {
            console.log('[DirectConnect].disconnect')
            if (this.rotationTimer) {
                clearInterval(this.rotationTimer)
                this.rotationTimer = undefined
            }
            this.browsers = []
            this.activeBrowser = undefined

            if (this.bonjour) {
                this.logger.logEvent( {message:'Disconnect from bonjour '})
                this.bonjour.stop()
                this.bonjour.removeAllListeners()
                this.bonjour = undefined
            }
        }
        catch(err:any) {
            this.logError(err,'diconnect')
        }
        return;
    }

    /**
     * Find services on the network with options
     * @param opts BrowserConfig
     * @param onup Callback when service up event received
     * @returns
     */

    find(opts: BrowserConfig | null, onup?: (svc: MulticastDnsAnnouncement) => void) {


        if (!this.bonjour) return

        try {

            const type = opts?.type ?? 'directconnect'
            const protocol = opts?.protocol ?? 'tcp'

            console.log('[DirectConnect].find', opts,{type,protocol})

            let browser = this.browsers.find( b=> b.type===type && b.protocol===protocol)
            if (!browser) {
                browser = {type,protocol,callbacks:[]}
                this.browsers.push(browser)

                // a new browser is started immediately, then all browsers take turns
                this.scan(browser)
                if (!this.rotationTimer && this.browsers.length>1)
                    this.rotationTimer = setInterval( this.scanNext.bind(this), BROWSER_ROTATION_INTERVAL)
            }
            if (onup)
                browser.callbacks.push(onup)

        }
        catch(err:any) {
            this.logError(err,'find')
        }

    }

    protected scan(browser:Browser) {
        this.activeBrowser = browser
        this.bonjour?.scan(browser.type, browser.protocol, 'local.')
    }

    protected scanNext() {
        try {
            const idx = this.activeBrowser ? this.browsers.indexOf(this.activeBrowser) : -1
            this.scan(this.browsers[(idx+1) % this.browsers.length])
        }
        catch(err:any) {
            this.logError(err,'scanNext')
        }
    }

    protected onResolved(service:any) {
        if (!service.addresses?.length) return

        console.log('[DirectConnect] got announcement', service)

        // a service might get resolved after the scan already switched to the next browser
        const browser = this.getBrowser(service) ?? this.activeBrowser
        if (!browser) return

        const announcement: MulticastDnsAnnouncement = {
            type: browser.type,
            protocol: browser.protocol,
            address: service.addresses[0],
            port: service.port,
            name: service.name,
            serialNo: service.txt?.serialNo,
            serviceUUIDs:service.txt?.['ble-service-uuids']?.split(','),
            transport:'tcp'
        }

        browser.callbacks.forEach( cb => cb(announcement))
    }

    // fullName is the host name followed by the service type, e.g. 'iPad.local._wahoo-fitness-tnp._tcp.'
    protected getBrowser(service:any):Browser|undefined {
        const match = /_([^.]+)\._(tcp|udp)\.?$/.exec(service.fullName ?? '')
        if (!match) return
        return this.browsers.find( b=> b.type===match[1] && b.protocol===match[2])
    }

}
