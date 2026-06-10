import { EventEmitter } from 'events'
import BleManager, { AdvertisingData, Peripheral } from 'react-native-ble-manager'
import { BleRawPeripheral, BleService, BleServiceData, DiscoverResult } from './types'
import { BleServiceRN } from './service'
import { BleRawCharacteristicRN } from './characteristics'
import {  EventSubscription} from 'react-native'
import { matches } from './utils'


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
        
        await BleManager.connect(this.id!)
        this.state = 'connected'

        this.subDisconnect = BleManager.onDisconnectPeripheral((event) => {

            if (event.peripheral === this.id) {
                this.state = 'disconnected'
                this.emit('disconnect')

                if (this.subDisconnect) {
                    this.subDisconnect.remove()
                    delete this.subDisconnect
                }

            }
        })
    }

    async disconnectAsync(): Promise<void> {
        try {
            await BleManager.disconnect(this.id!)
            this.state = 'disconnected'

            if (this.subDisconnect) {
                this.subDisconnect.remove()
                delete this.subDisconnect
            }
        }
        catch(err:any) {
            console.log('[BlePeripheral] disconnectAsync error',err.message)
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
            console.log('[BlePeripheralRN] discoverServicesAsync error',err.message)
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
            console.log('[BlePeripheral] discoverSomeServicesAndCharacteristicsAsync error',err.message)
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
        const companyIdInt = parseInt(companyIdHex, 16);

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
            .replace(/-/g, '')
    }    

}
