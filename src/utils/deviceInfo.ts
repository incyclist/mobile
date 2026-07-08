import { EventLogger } from 'gd-eventlog';
import DeviceInfo from 'react-native-device-info';

export const logDeviceInfo = async (additional?:any): Promise<void> => {

    const logger = new EventLogger('Incyclist')

    const [deviceName, manufacturer,isEmulator] = await Promise.all([
        DeviceInfo.getDeviceName(),
        DeviceInfo.getManufacturer(),
        DeviceInfo.isEmulator()
    ]);

    const addProps = additional??{}

    logger.logEvent( { message:'Mobile device info',
        deviceName,
        manufacturer,
        isEmulator,
        model:         DeviceInfo.getModel(),
        brand:         DeviceInfo.getBrand(),
        systemName:    DeviceInfo.getSystemName(),
        systemVersion: DeviceInfo.getSystemVersion(),
        isTablet:      DeviceInfo.isTablet(),
        appVersion:    DeviceInfo.getVersion(),
        buildNumber:   DeviceInfo.getBuildNumber(),
        ...addProps
    });
};