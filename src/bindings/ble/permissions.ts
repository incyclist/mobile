import { Platform } from 'react-native'
import {
    check,
    PERMISSIONS,
    RESULTS
} from 'react-native-permissions'

export async function hasBlePermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
        const perm = Platform.Version >= 31
            ? PERMISSIONS.ANDROID.BLUETOOTH_SCAN
            : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION

        const status = await check(perm)
        return status === RESULTS.GRANTED
    }

    return true
}
