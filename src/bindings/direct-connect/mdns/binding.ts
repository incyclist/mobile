import { EventLogger } from 'gd-eventlog'
import Zeroconf from 'react-native-zeroconf'
import type { BrowserConfig, MulticastDnsAnnouncement, MulticastDnsBinding } from '../types'

export class ReactNativeMdnsBinding  implements MulticastDnsBinding{
    private _logger!: EventLogger
    private _connected: boolean = false
    private browsers: Map<string,Zeroconf> = new Map<string,Zeroconf>()

    connect():void {           

        try {
            let log = true
            if (this._connected) {
                this.disconnect()
                log = false
            }
            this._connected = true

            if (log)
                this.logger.logEvent( {message:'Connect to bonjour '})
            return;

        }
        catch(err:any) {
            this.logError(err,'connect')
        }
    }

    disconnect():void {
        try {
            if (this._connected) {
                this.logger.logEvent( {message:'Disconnect from bonjour '})

                const searches = Object.keys(this.browsers)
                searches.forEach( search => {
                    const browser = this.browsers.get(search)
                    browser?.stop()
                    browser?.removeAllListeners()
                })               
            }            
        }
        catch(err:any) {
            this.logError(err,'diconnect')
        }
        finally {
            this.browsers.clear()
            this._connected = false
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

        if (!this._connected) return

        // no support for wildcard search
        if (!opts?.type)
            return


        try {

            const type = opts?.type ?? 'directconnect'
            const protocol = opts?.protocol ?? 'tcp'
            const domain = 'local.'


            const key = `${type}:${protocol}:${domain}`
            let browser = this.browsers.get(key)
            if (!browser) {
                browser = new Zeroconf()
                this.browsers.set(key,browser)
            }

            this.logger.logEvent( {message:'start scan', type,protocol,domain})

            browser.on('resolved', (service:any) => {
                if (!service.addresses?.length) return

                this.logger.logEvent( {message:'got announcement', type,protocol,domain,service})

                const announcement: MulticastDnsAnnouncement = {
                type,
                protocol,
                address: service.addresses[0],
                port: service.port,
                name: service.name,
                serialNo: service.txt?.serialNo,
                serviceUUIDs:service.txt?.['ble-service-uuids']?.split(','),
                transport:'tcp'

                }

                onup?.(announcement)
            })

            browser.scan(type, protocol, domain)

        }
        catch(err:any) {
            this.logError(err,'find')
        }

    }

    protected get logger():EventLogger {
        this._logger = this._logger??new EventLogger('DirectConnect')
        return this._logger
    }

    protected logError(err:any,fn:string) {
        this.logger.logEvent({message:'error', fn, error:err.message, stack:err.stack})
    }


  
}