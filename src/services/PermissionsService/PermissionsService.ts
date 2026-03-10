import { Platform } from 'react-native'
import {
    check,
    request,
    PERMISSIONS,
    RESULTS,
    Permission
} from 'react-native-permissions'

export class PermissionService {

    async hasBlePermission(): Promise<boolean> {

        if (Platform.OS !== 'android') {
            return true
        }

        const permissions = this.getAndroidPermissions()

        for (const perm of permissions) {
            const status = await check(perm)
            if (status !== RESULTS.GRANTED) {
                return false
            }
        }

        return true
    }

    async requestBlePermission(): Promise<boolean> {
        if (Platform.OS !== 'android') {
            return true
        }

        const permissions = this.getAndroidPermissions()

        for (const perm of permissions) {
            const status = await request(perm)
            if (status !== RESULTS.GRANTED) {
                return false
            }
        }

        return true
    }

    async requestStoragePermission() {
        if (Platform.OS === 'android') {
            const version = Number(Platform.Version);
            if (version >= 33) return true; // Permissions handled differently for media
            
            const granted = await request(PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE);
            return granted === RESULTS.GRANTED;
        }
        return true; // iOS handles this via Info.plist descriptions
    }    

    private getAndroidPermissions(): Permission[] {
        if (Number(Platform.Version) >= 31) {
            return [
                PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
                PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
                PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
            ]
        }

        return [
            PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
        ]
    }
}
