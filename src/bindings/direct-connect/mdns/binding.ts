import { EventLogger } from 'gd-eventlog'
import Zeroconf from 'react-native-zeroconf'
import type { BrowserConfig, MulticastDnsAnnouncement, MulticastDnsBinding } from '../types'

export class ReactNativeMdnsBinding  implements MulticastDnsBinding{
    private bonjour:Zeroconf|undefined
    private _logger!: EventLogger

    connect():void {            
        try {
            console.log('[DirectConnect].connect')
            if (!this.bonjour) {
                this.bonjour = new Zeroconf()

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
            if (this.bonjour) {
                this.logger.logEvent( {message:'Disconnect from bonjour '})
                this.bonjour.stop()
                this.bonjour.removeAllListeners()
                this.bonjour = null
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
            const domain = 'local.'

            
            console.log('[DirectConnect].find', opts,{type,protocol,domain})

            this.bonjour.on('resolved', (service:any) => {
                if (!service.addresses?.length) return

                console.log('[DirectConnect] got announcement', service)

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


            this.bonjour.scan(type, protocol, domain)

        }
        catch(err:any) {
            this.logError(err,'find')
        }

    }

  
}
