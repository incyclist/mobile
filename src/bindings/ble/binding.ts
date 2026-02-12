import { EventEmitter } from 'events'
import { NativeEventEmitter, NativeModules } from 'react-native'
import BleManager, { BleManagerDidUpdateStateEvent, BleState, Peripheral } from 'react-native-ble-manager'
import {
    BleBinding,
    BleInterfaceState,
    StatScanningCallback,
} from './types'

import { BlePeripheralRN } from './peripheral'
import { EventLogger } from 'gd-eventlog'

const BleManagerModule = NativeModules.BleManager
const bleEmitter = new NativeEventEmitter(BleManagerModule)

export class BleBindingRN extends EventEmitter implements BleBinding {

    private static instance: BleBindingRN 

    private _state: BleInterfaceState | undefined
    private scanning = false

    private logger = new EventLogger('BLE')

    public static getInstance(): BleBindingRN {
        this.instance = this.instance ?? new BleBindingRN()
        return this.instance
    }

    constructor() {
        super()

        BleManager.onDidUpdateState( this.onStateChanged.bind(this))
        BleManager.onDiscoverPeripheral(this.onDiscoverPeripheral.bind(this))
        BleManager.onStopScan( this.onScanStopped.bind(this))
    }

    get state():BleInterfaceState {

        // first call, should trigger connection attempt
        if (this._state===undefined) {
            this.logger.logEvent({message:'starting BLE manager ..'})
            BleManager.start({ showAlert: false })
            this._state = 'unknown'
            BleManager.checkState().then( bleState => {
                const prev = this._state
                this._state = this.mapState(bleState)
                if (prev!==this._state)
                    this.emit('stateChange', this._state)
            })
            
        }
        
        return this._state

    }



    emit(eventName: string | symbol, ...args: any[]): boolean {
        try {
            return super.emit(eventName,...args)
        }
        catch {
            return false
        }
    }

    onStateChanged( event:BleManagerDidUpdateStateEvent):void {
 
        const prev = this._state

        const mapped = this.mapState(event.state)
        this._state = mapped

        if (prev!==this._state)
            this.emit('stateChange', mapped)
    }

    onScanStopped() {
        this.scanning = false
    }

    onDiscoverPeripheral(announced:Peripheral) {
        try {
            const peripheral = new BlePeripheralRN(announced)
            this.emit('discover', peripheral)
        }
        catch(err) {
            console.log('# onDiscoverPeripheral ERROR',err, announced.name??announced.advertising?.localName)
        }

    }

    startScanning(
        serviceUUIDs?: string[],
        allowDuplicates: boolean = false,
        callback?: StatScanningCallback
    ): void {
        if (this.scanning) {
            callback?.()
            return
        }

        this.scanning = true

        bleEmitter.addListener(
            'BleManagerDiscoverPeripheral',
            (peripheral) => {
                const wrapped = new BlePeripheralRN(peripheral)
                this.emit('discover', wrapped)
            }
        )

        BleManager.scan( { 
            serviceUUIDs:serviceUUIDs ?? [],
            seconds: 0,
            allowDuplicates
        })
            .then(() => callback?.())
            .catch((err) => {
                console.log('# BLEManager.scan ERROR',err)
                this.emit('error', err)
                //callback?.(err)
            })
    }

    stopScanning(callback?: () => void): void {
        if (!this.scanning) {
            callback?.()
            return
        }

        BleManager.stopScan()
            .finally(() => {
                this.scanning = false
                callback?.()
            })
    }

    pauseLogging(): void {
        // no-op (binding-level logging only)
    }

    resumeLogging(): void {
        // no-op
    }

    setServerDebug(_enabled: boolean): void {
        // not applicable in React Native
    }
    
    private mapState(state: string|BleState): BleInterfaceState {
        switch (state) {
            case 'on':
                return 'poweredOn'
            case 'off':
                return 'poweredOff'
            case 'unauthorized':
                return 'unauthorized'
            case 'unsupported':
                return 'unsupported'
            case 'resetting':
                return 'resetting'
            case 'turning_on':
                return 'poweredOff'
            case 'turning_off':
                return 'poweredOn'
            default:
                return 'unknown'
        }
    }
}
