import { BleCharacteristic, BleService } from './types'

export class BleServiceRN implements BleService {
    public uuid: string
    public characteristics:BleCharacteristic[] = []

    constructor(uuid: string) {
        this.uuid = uuid
    }
}
