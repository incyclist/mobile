import type { TurboModule } from 'react-native';
import { Platform, TurboModuleRegistry } from 'react-native';

export interface ReadDirItem {
    name: string;
    uri: string;
    isDirectory: boolean;
}

export interface Spec extends TurboModule {
    listFiles(uri: string): Promise<ReadDirItem[]>;
    readFile(uri: string, encoding: string): Promise<string>;
    exists(uri: string): Promise<boolean>;
}

const FolderAccess: Spec | undefined =
    Platform.OS === 'android' || Platform.OS === 'ios'
        ? TurboModuleRegistry.getEnforcing<Spec>('FolderAccess')
        : undefined;

export default FolderAccess;
