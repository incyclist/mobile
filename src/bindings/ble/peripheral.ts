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
        catch(err) {
            console.log('#ERROR',err)
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
        catch(err) {
            console.log('# ERROR in disconnectAsync',err)
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

            console.log( '[Ble] discoverServices result', res.map( s=>s.uuid))
            return res

        }
        catch(err) {
            console.log('# ERROR in discoverServicesAsync',err)
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

            console.log( '[Ble] discoverServicesAndCharacteristics result', 
                (res.services??[]).map( s=>s.uuid),
                (res.characteristics??[]).map( c=>c.uuid)
            )


            return res;
        }
        catch(err) {
            console.log('# ERROR in discoverSomeServicesAndCharacteristicsAsync',err)
            return {services:[], characteristics:[]}
        }

    }

    private mapAdvertisement(advertising:  AdvertisingData) {
        const adv = advertising ?? {}

        return {
            localName: adv.localName ?? this.name,
            txPowerLevel: adv.txPowerLevel,
            manufacturerData: this.mapManufacturerData(adv.manufacturerData),
            serviceData: this.mapServiceData(adv.serviceData),
            serviceUuids: this.mapServiceUuids(adv.serviceUUIDs)
        }
    }

    private mapManufacturerData(data: any ): Buffer | undefined {
        if (!data?.data) {
            return undefined
        }

        return Buffer.from(data.data)
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
                    data: Buffer.from(entry.data)
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
