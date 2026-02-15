import { EventEmitter } from 'events'
import BleManager from 'react-native-ble-manager'
import { Buffer } from 'buffer'

import {
    BleRawCharacteristic,
    BleProperty
} from './types'
import { EventSubscription} from 'react-native'
import { matches } from './utils'


export class BleRawCharacteristicRN extends EventEmitter implements BleRawCharacteristic {

    public uuid: string
    public properties: BleProperty[]
    public name?: string
    public _serviceUuid?: string

    private deviceId: string
    private subscribed: number = 0
    private subscription: EventSubscription|undefined

    constructor(
        deviceId: string,
        serviceUuid: string,
        characteristic: any
    ) {
        super()

        this.deviceId = deviceId
        this.uuid = characteristic.characteristic
        this._serviceUuid = serviceUuid
        this.name = characteristic.descriptor

        this.properties = mapProperties(characteristic.properties)
    }

    subscribe(callback: (err: Error | undefined) => void): void {

        if (!this.subscription) {
            BleManager.onDidUpdateValueForCharacteristic((event) => {


                if (
                    event.peripheral === this.deviceId &&
                    matches(event.service,this._serviceUuid!) &&
                    matches(event.characteristic,this.uuid)
                ) {



                    this.emit(
                        'data',
                        Buffer.from(event.value),
                        true
                    )
                }
            })

            BleManager.startNotification(
                this.deviceId,
                this._serviceUuid!,
                this.uuid
            )
            .then(() => { 
                callback(undefined) 
            })
            .catch(err => {
                callback(err) 
            })
        }
        else {
            callback(undefined) 
        }
        
        this.subscribed++

    }

    unsubscribe(callback: (err: Error | undefined) => void): void {

        if (this.subscribed<=1) {
            if (this.subscription) {
                this.subscription.remove()
                delete this.subscription
            }
        }

        if (!this.subscription) {
            BleManager.stopNotification(
                this.deviceId,
                this._serviceUuid!,
                this.uuid
            )
            .then(() => { 
                callback(undefined)
            })
            .catch(err => callback(err))
        } else {
            this.subscribed = Math.min(this.subscribed-1,0)
            callback(undefined)
        }

    }

    read(callback: (err: Error | undefined, data: Buffer) => void): void {
        BleManager.read(
            this.deviceId,
            this._serviceUuid!,
            this.uuid
        )
        .then(data => callback(undefined, Buffer.from(data)))
        .catch(err => callback(err, Buffer.alloc(0)))
    }

    write(
        data: Buffer,
        withoutResponse: boolean,
        callback?: (err: Error | undefined) => void
    ): void {

        if (withoutResponse) {
            BleManager.writeWithoutResponse(
                this.deviceId,
                this._serviceUuid!,
                this.uuid,
                Array.from(data)
            )
            .then(() => callback?.(undefined))
            .catch(err => callback?.(err))

        }
        else {

            BleManager.write(
                this.deviceId,
                this._serviceUuid!,
                this.uuid,
                Array.from(data)
            )
            .then(() => callback?.(undefined))
            .catch(err => callback?.(err))


        }
    }
}

function mapProperties(props: any): BleProperty[] {
    const result: BleProperty[] = []

    if (props.Read) result.push('read')
    if (props.Write) result.push('write')
    if (props.WriteWithoutResponse) result.push('write')
    if (props.Notify) result.push('notify')
    if (props.Indicate) result.push('indicate')

    // TODO: Check how to address these:
        // Broadcast?: 'Broadcast';
        // AuthenticatedSignedWrites?: 'AuthenticatedSignedWrites';
        // ExtendedProperties?: 'ExtendedProperties';
        // NotifyEncryptionRequired?: 'NotifyEncryptionRequired';
        // IndicateEncryptionRequired?: 'IndicateEncryptionRequired';
        


    return result
}
