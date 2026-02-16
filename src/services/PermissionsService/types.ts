export interface IPermissionService {
    hasBlePermission(): Promise<boolean>
    requestBlePermission(): Promise<boolean>
}