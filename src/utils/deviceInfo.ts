import { EventLogger } from 'gd-eventlog';
import DeviceInfo from 'react-native-device-info';

export const logDeviceInfo = async (additional?:any): Promise<void> => {

    const logger = new EventLogger('Incyclist')

    const [deviceName, manufacturer] = await Promise.all([
        DeviceInfo.getDeviceName(),
        DeviceInfo.getManufacturer(),
    ]);

    const addProps = additional??{}

    logger.logEvent( { message:'Mobile device info',
        deviceName,
        manufacturer,
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