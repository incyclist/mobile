import { EventEmitter }from "events"

export interface Socket extends EventEmitter {
    connect(port: number, host:string): Socket
    destroy(): void
    write(data:Buffer):boolean
}

export interface NetBinding {
    createSocket(): Socket
}


export interface DirectConnectBinding {
    mdns: MulticastDnsBinding
    net:NetBinding
}

type KeyValue = { [key: string]: any }

export interface BrowserConfig {
    type?        : string
    name?       : string
    protocol?   : 'tcp' | 'udp'
    subtypes?   : string[]
    txt?        : KeyValue
}

export interface PeripheralAnnouncement {
    name        : string
    serviceUUIDs: string[]
    transport:    string  
}

export type BleProperty = 'notify' | 'read' | 'write' | 'indicate'

export interface BleCharacteristic  {
    uuid: string;
    properties: BleProperty[];
    name?: string
    _serviceUuid?: string
}

export type BleService = {
    uuid: string;
    characteristics?: BleCharacteristic[]
}

export type DiscoverResult = {
    services: BleService[]
    characteristics: any[]
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
    advertisement: any;
    state: string

    connectAsync(): Promise<void>;
    disconnectAsync(): Promise<void>;

    disconnect( cb:(err?:Error)=>void ): Promise<void>;
    discoverSomeServicesAndCharacteristicsAsync(serviceUUIDs: string[], characteristicUUIDs: string[]): Promise<DiscoverResult>;
    discoverServicesAsync?(serviceUUIDs: string[]): Promise<BleService[]>;
}


export interface BlePeripheralAnnouncement extends PeripheralAnnouncement { 
    advertisement: any;
    manufacturerData?: Buffer;
    peripheral: BleRawPeripheral
}
export interface MulticastDnsAnnouncement extends PeripheralAnnouncement{
    type        : string  
    address     : string
    protocol?   : 'tcp' | 'udp'
    port        : number
    serialNo?   : string
}

export interface MulticastDnsBinding {

    connect(): void

    disconnect(): void      

    /**
     * Find services on the network with options
     * @param opts BrowserConfig
     * @param onup Callback when service up event received
     * @returns
     */
    find(opts: BrowserConfig | null, onup?: (service: MulticastDnsAnnouncement) => void): void
}