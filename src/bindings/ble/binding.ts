import { EventEmitter } from 'events'
import { NativeEventEmitter, NativeModules, Platform } from 'react-native'
import BleManager, { BleManagerDidUpdateStateEvent, BleState, Peripheral } from 'react-native-ble-manager'
import {
    BleBinding,
    BleInterfaceState,
    StatScanningCallback,
} from './types'

import { BlePeripheralRN }
 from './peripheral'
import { EventLogger } from 'gd-eventlog'
import { PermissionService } from '../../services'

const BleManagerModule = NativeModules.BleManager
const bleEmitter = new NativeEventEmitter(BleManagerModule)

export class BleBindingRN extends EventEmitter implements BleBinding {

    private static instance: BleBindingRN 

    private _state: BleInterfaceState | undefined
    private authState: 'unknown' | 'known' = 'unknown'
    private scanning = false
    private started = false

    private logger = new EventLogger('BLE')
    private permissionsService: PermissionService

    public static getInstance(): BleBindingRN {
        this.instance = this.instance ?? new BleBindingRN()
        return this.instance
    }

    async initializeAuthorization(): Promise<void> {
        if (Platform.OS==='android') {
            this._state ='unauthorized'
        }
        const authorized = await this.permissionsService.hasBlePermission()
        this.authState='known'
        this.setAuthorized(authorized)
    }    

    constructor() {
        super()

        BleManager.onDidUpdateState( this.onManagerStateChanged.bind(this))
        BleManager.onDiscoverPeripheral(this.onDiscoverPeripheral.bind(this))
        BleManager.onStopScan( this.onScanStopped.bind(this))
        this.permissionsService = new PermissionService()

        if (Platform.OS==='android') {
            this.setAuthorized(false)
        }
        this.initializeAuthorization()
       
    }

    start() {
        if (this.started)
            return;

        this._state = this._state ?? 'unknown'

        this.logger.logEvent({message:'starting BLE manager ..'})
        BleManager.start({ showAlert: false })
        .then( ()=> { 
            this._state = this._state ?? 'unknown'

            // read the initial state
            BleManager.checkState().then( bleState => {
                this.updateState(bleState)
            })
         })
        this.started = true
    }

    get state():BleInterfaceState {

        // first call, should trigger connection attempt
        if (!this.started) {
            this.start()
        }
        
        return this._state??'unknown'

    }

    setAuthorized(authorized: boolean): void {
        if (!authorized) {
            this._state = 'unauthorized';
            this.emit('stateChange', 'unauthorized');
        } else {

            this._state = 'unknown'
            this.emit('stateChange', this._state)

            // Don't assume poweredOn. Ask the hardware.
            BleManager.checkState().then( state => {
                    const next = this.mapState(state)               
                    if (this.state !== next) {
                        this._state = next
                        this.emit('stateChange', next)
                    }

            })
        }


        
    }

    protected updateState( bleState:BleState) {

        if (Platform.OS==='android' && this.authState==='unknown')
            return;
        if (Platform.OS==='android' && this.authState==='known' && this.state === 'unauthorized')
            return
        

        const prev = this._state
        this._state = this.mapState(bleState)
        
        if (prev!==this._state || this._state==='poweredOn') {
            this.emit('stateChange', this._state)
            if (prev!==this._state) {        
                this.logger.logEvent({message:'BLE state changed', transition:{ from:prev, to: this._state}})
            }

        }

    }



    onManagerStateChanged( event:BleManagerDidUpdateStateEvent):void { 
        if (Platform.OS==='android' && this._state==='unauthorized') {
            return
        }
        this.updateState(event.state)
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

        this.logger.logEvent({message:'starting BLE peripheral scan ...'})

        
        bleEmitter.addListener( 'BleManagerDiscoverPeripheral',this.onDiscoverPeripheral.bind(this))

        BleManager.scan( { 
            serviceUUIDs:serviceUUIDs ?? [],
            seconds: 0,
            allowDuplicates
        })
            .then(() => callback?.())
            .catch((err) => {
                this.emit('error', err)
                //callback?.(err)
            })
    }

    stopScanning(callback?: () => void): void {
        if (!this.scanning) {
            callback?.()
            return
        }
        this.logger.logEvent({message:'stopping BLE peripheral scan'})

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