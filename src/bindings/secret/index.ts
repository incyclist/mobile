import { getUserSettingsBinding } from "../user-settings"
import defSettings from '@settings'

class SecretBinding  {
    protected static _instance: SecretBinding;

    static getInstance(): SecretBinding {
        SecretBinding._instance = SecretBinding._instance ?? new SecretBinding()
        return SecretBinding._instance;
    }

    getSecret(key:string):string {
        return (defSettings as Record<string, string>)[key] ?? getUserSettingsBinding().getValue(key, null)

    }
    async init():Promise<void> {
        return;
    }
}

export const getSecretBinding =() => SecretBinding.getInstance()