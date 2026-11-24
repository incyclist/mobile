import { EventEmitter } from 'events'
import BleManager, { AdvertisingData, Peripheral } from 'react-native-ble-manager'
import { BleRawPeripheral, BleService, BleServiceData, DiscoverResult } from './types'
import { BleServiceRN } from './service'
import { BleRawCharacteristicRN } from './characteristics'
import {  EventSubscription} from 'react-native'
import { matches } from './utils'
import { EventLogger } from 'gd-eventlog'


const DISCONNECT_VERIFY_TIMEOUT = 800
const DISCONNECT_VERIFY_INTERVAL = 100

// After the last GATT client of a device is closed, Android keeps the LE link up for a short idle timeout.
// A connect() within that window attaches to the old link (connected within ~30ms, no new link, the peripheral
// never sees a disconnect). A reconnect must therefore not start before this time has passed.
const LINK_IDLE_SETTLE_TIME = 2000
const lastDisconnect: Record<string,number> = {}

export class BlePeripheralRN
    extends EventEmitter
    implements BleRawPeripheral {

    public id?: string
    public address?: string
    public name?: string
    public services: any[] = []
    public advertisement: any
    public state: string = 'disconnected'
    private subDisconnect: EventSubscription|undefined
    private logger = new EventLogger('BLE')

    constructor(private peripheral: Peripheral) {
        super()

        try{
            this.id = peripheral.id
            this.name = peripheral.name
            this.advertisement = this.mapAdvertisement(peripheral.advertising)
        }
        catch(err:any) {
            console.log('[BlePeripheral] error in constructor',err.message)
        }
    }

    async connectAsync(): Promise<void> {

        await this.waitForLinkIdle()
        await BleManager.connect(this.id!)
        this.state = 'connected'

        this.subDisconnect = BleManager.onDisconnectPeripheral((event) => {
            try {
                if (event.peripheral === this.id) {
                    this.state = 'disconnected'
                    this.emit('disconnect')

                    if (this.subDisconnect) {
                        this.subDisconnect.remove()
                        delete this.subDisconnect
                    }

                }
            }
            catch(err:any) {
                this.logger.logEvent({message:'error', fn:'onDisconnectPeripheral', error:err.message, stack:err.stack})
            }
        })
    }

    /**
     * Tears down the native GATT connection and waits until the OS reports the peripheral as disconnected.
     *
     * The disconnect has to be forced: without `force`, Android only calls gatt.disconnect() and resolves
     * immediately, keeping the BluetoothGatt object open. A reconnect right afterwards then attaches to the
     * still-open (possibly stalled) link, `connect` returns instantly and the peripheral is never really
     * restarted.
     */
    async disconnectAsync(): Promise<void> {
        const id = this.id!
        try {
            await BleManager.disconnect(id, true)
            let stillConnected = await this.waitForNativeDisconnect(id)

            if (stillConnected) {
                this.logger.logEvent({message:'peripheral still connected after disconnect, retrying', address:id})
                await BleManager.disconnect(id, true)
                stillConnected = await this.waitForNativeDisconnect(id)
                if (stillConnected) {
                    this.logger.logEvent({message:'peripheral still connected after forced disconnect', address:id})
                }
            }
        }
        catch(err:any) {
            this.logger.logEvent({message:'error', fn:'disconnectAsync', address:id, error:err?.message})
        }

        lastDisconnect[id] = Date.now()
        this.state = 'disconnected'
        if (this.subDisconnect) {
            this.subDisconnect.remove()
            delete this.subDisconnect
        }
    }

    private async waitForLinkIdle(): Promise<void> {
        const last = lastDisconnect[this.id!]
        if (last===undefined)
            return

        const wait = LINK_IDLE_SETTLE_TIME - (Date.now()-last)
        if (wait>0) {
            this.logger.logEvent({message:'waiting for the old link to be released before reconnect', address:this.id, waitMs:wait})
            await new Promise( done => setTimeout(done, wait) )
        }
    }

    private async waitForNativeDisconnect(id:string, start:number=Date.now()): Promise<boolean> {
        const connected = await this.isNativeConnected(id)
        if (!connected || Date.now()-start >= DISCONNECT_VERIFY_TIMEOUT)
            return connected

        await new Promise( done => setTimeout(done, DISCONNECT_VERIFY_INTERVAL) )
        return this.waitForNativeDisconnect(id, start)
    }

    private async isNativeConnected(id:string): Promise<boolean> {
        try {
            return await BleManager.isPeripheralConnected(id)
        }
        catch(err:any) {
            this.logger.logEvent({message:'error', fn:'isPeripheralConnected', address:id, error:err?.message})
            return false
        }
    }

    async disconnect(cb: (err?: Error) => void): Promise<void> {
        try {
            await this.disconnectAsync()
            cb()
        } catch (err: any) {
            cb(err)
        }
    }

    async discoverServicesAsync(serviceUUIDs: string[]):Promise<BleService[]> {
        try {
            const filter = serviceUUIDs?.length>0 ? serviceUUIDs : undefined
            const info = await BleManager.retrieveServices(this.id!, filter)
            const available = info.services??[]

            const res =  available.map( s=> new BleServiceRN( s.uuid)  )

            return res

        }
        catch(err:any) {
            this.logger.logEvent({message:'error', fn:'discoverServicesAsync', address:this.id, error:err?.message})
            return []
        }
    }


    async discoverSomeServicesAndCharacteristicsAsync(
        serviceUUIDs: string[],
        characteristicUUIDs: string[]
    ): Promise<DiscoverResult> {
        try {
            const filterServices = serviceUUIDs?.length>0 ? serviceUUIDs : undefined
            const filterCharacteristics = characteristicUUIDs?.length>0 ? characteristicUUIDs : undefined

            const info = await BleManager.retrieveServices(this.id!,filterServices)

            const services: BleService[] = []
            const characteristics: BleRawCharacteristicRN[] = []

            const available = info.services??[]
            for (const service of available) {


                const newService = new BleServiceRN( service.uuid) 
                services.push(newService)


                const availableChars = info.characteristics??[]
                const serviceChars = availableChars.filter(
                    c => matches(c.service,service.uuid)
                )

                for (const char of serviceChars) {

                    if (
                        filterCharacteristics &&
                        !filterCharacteristics.includes(char.characteristic)
                    ) {
                        continue
                    }

                    const newCharacteristic = new BleRawCharacteristicRN(
                        this.id!,
                        service.uuid,
                        char
                    )

                    characteristics.push(newCharacteristic)
                    newService.characteristics.push(newCharacteristic)
                }


            }

            const res =  {
                services,
                characteristics
            }

            return res;
        }
        catch(err:any) {
            this.logger.logEvent({message:'error', fn:'discoverSomeServicesAndCharacteristicsAsync', address:this.id, error:err?.message})
            return {services:[], characteristics:[]}
        }

    }

    private mapAdvertisement(advertising:  AdvertisingData) {
        const adv = advertising ?? {}
        //console.log('# map advertiesement', adv)
        return {
            localName: adv.localName ?? this.name,
            txPowerLevel: adv.txPowerLevel,
            manufacturerData: this.mapManufacturerData(adv.manufacturerData),
            serviceData: this.mapServiceData(adv.serviceData),
            serviceUuids: this.mapServiceUuids(adv.serviceUUIDs)
        }
    }

    private mapManufacturerData(manufacturerData: any ): Buffer | undefined {
        const fallbackCompanyIdHex = "0000"
        if (!manufacturerData) return undefined;

        const keys = Object.keys(manufacturerData);
        let companyIdHex = fallbackCompanyIdHex;
        let payloadBytes = [];

        // Case 1: Format B (Keyed by Company ID string, e.g., { "0059": { bytes: [...], data: "..." } })
        if (!keys.includes('bytes') && !keys.includes('data') && keys.length > 0) {
            companyIdHex = keys[0]; // e.g., "0059"
            payloadBytes = manufacturerData[companyIdHex].bytes || [];
        } 
        // Case 2: Format A (Direct payload object, e.g., { bytes: [...], data: "..." })
        else if (manufacturerData.bytes) {
            payloadBytes = manufacturerData.bytes;
            
            // Core Android Caveat Check: 
            // On some older Android devices/versions, the first 2 bytes of the 'bytes' array 
            // MIGHT already be the Company ID. If the array is longer than your expected 
            // custom payload, check if it already contains the ID.
        }

        // 1. Convert the Hex Company ID (Big Endian String "0059") into an Integer
        const companyIdInt = Number.parseInt(companyIdHex, 16);

        // 2. Extract the Little Endian bytes for the Company ID
        const companyIdByte1 = companyIdInt & 0xFF;        // Low byte (0x59)
        const companyIdByte2 = (companyIdInt >> 8) & 0xFF; // High byte (0x00)

        // 3. Assemble the continuous array matching noble: [ID_Low, ID_High, ...Payload]
        const nobleArray = [companyIdByte1, companyIdByte2, ...payloadBytes];

        // 4. Return as a Buffer so you can use standard noble `.readUInt16LE()` methods
        return Buffer.from(nobleArray);        

    }

    private mapServiceData( serviceData: any): BleServiceData[] | undefined {

        if (!serviceData) {
            return undefined
        }

        const result: BleServiceData[] = []

        for (const uuid of Object.keys(serviceData)) {
            const entry = serviceData[uuid]
            if (entry?.data) {
                result.push({
                    uuid: this.normalizeUuid(uuid),
                    data: Buffer.from(entry.bytes,'binary')
                })
            }
        }

        return result.length ? result : undefined
    }

    private mapServiceUuids( uuids?: string[] ): string[] | undefined {

        if (!uuids || !uuids.length) {
            return undefined
        }

        return uuids.map( uuid=> this.normalizeUuid(uuid))
    }    

    private normalizeUuid(uuid: string): string {
        return uuid
            .toLowerCase()
            .replaceAll('-', '')
    }

}
