import  { EventEmitter } from "events"

export type StatScanningCallback = (error?: Error) => void

export type BleInterfaceState  =  'unknown' | 'resetting' | 'unsupported' | 'unauthorized' | 'poweredOff'|  'poweredOn'


// 'stateChange' event
export type StateChangeEventHandler = (state:BleInterfaceState)=>void

// 'error' event
export type ErrorEventhandler = (error?: Error) => void

// 'discover' event
export type DiscoverEventhandler = (peripheral:BleRawPeripheral)=>void   


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


export type DiscoverResult = {
    services: BleService[]
    characteristics: BleRawCharacteristic[]
}

export interface BleRawCharacteristic extends BleCharacteristic, EventEmitter {
    subscribe( callback: (err:Error|undefined)=>void): void
    unsubscribe( callback: (err:Error|undefined)=>void): void
    read( callback: (err:Error|undefined, data:Buffer)=>void): void
    write(data:Buffer, withoutResponse:boolean,callback?: (err:Error|undefined)=>void): void
}

export type BleService = {
    uuid: string;
    characteristics?: BleCharacteristic[]
}

export interface BleCharacteristic  {
    uuid: string;
    properties: BleProperty[];
    name?: string
    _serviceUuid?: string
}

export type BleProperty = 'notify' | 'read' | 'write' | 'indicate'

