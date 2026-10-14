import  { EventEmitter } from "events"

// The binding contract that incyclist-devices expects. These are re-exported by incyclist-services
// and must not be re-declared here: a local copy drifts silently when devices changes the contract.
// (type-only imports: they are erased at build time, so this file never loads the services barrel)
import type {
    BleInterfaceState,
    BleProperty,
    BleCharacteristic,
    BleRawCharacteristic,
    BleService,
    DiscoverResult,
} from "incyclist-services"

export type {
    BleInterfaceState,
    BleProperty,
    BleCharacteristic,
    BleRawCharacteristic,
    BleService,
    DiscoverResult,
}

export type StatScanningCallback = (error?: Error) => void


// 'stateChange' event
export type StateChangeEventHandler = (state:BleInterfaceState)=>void

// 'error' event
export type ErrorEventhandler = (error?: Error) => void

// 'discover' event
export type DiscoverEventhandler = (peripheral:BleRawPeripheral)=>void


// Kept local on purpose, although incyclist-devices has a type of the same name: devices' BleBinding
// also demands a `_bindings` member (a detail of its Noble binding) that this RN binding does not have.
export interface BleBinding extends EventEmitter {
    // starts a scan, emits  'discover' events for every peripheral that got announced
    startScanning(serviceUUIDs?: string[], allowDuplicates?: boolean, callback?: StatScanningCallback): void;

    stopScanning(callback?: () => void): void;

    // pause any logging
    pauseLogging():void

    // pause any logging
    resumeLogging():void

    // if the binding is implemented by a server, enabled/disable logging on that server
    setServerDebug(enabled:boolean):void

    // the current state ( based on state it has received )
    state: BleInterfaceState;

}

// Kept local on purpose: devices only has `BleRawAdvertisement` (address/localName/serviceUuids/rssi),
// which is a different shape. This one describes what react-native-ble-plx provides.
export type BleServiceData = {uuid: string, data: Buffer}

export interface BleAdvertisement {
    localName?: string
    txPowerLevel?: number
    manufacturerData?: Buffer
    serviceData?: Array<BleServiceData>
    serviceUuids?: string[]
}

/**
 * Peripheral as provided by the binding (Noble library)
 * this will be used as interface to communicate with the device
 *
 * Kept local on purpose: identical to devices' BleRawPeripheral except that `advertisement` is
 * typed (BleAdvertisement) here, where devices types it as `any`.
 **/
export interface BleRawPeripheral extends EventEmitter{
    id?: string;
    address?: string;
    name?: string;
    services: any[];
    advertisement: BleAdvertisement;
    state: string

    connectAsync(): Promise<void>;
    disconnectAsync(): Promise<void>;

    disconnect( cb:(err?:Error)=>void ): Promise<void>;
    discoverSomeServicesAndCharacteristicsAsync(serviceUUIDs: string[], characteristicUUIDs: string[]): Promise<DiscoverResult>;
    discoverServicesAsync?(serviceUUIDs: string[]): Promise<BleService[]>;
}
