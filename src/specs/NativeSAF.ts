import type { TurboModule } from 'react-native';
import { Platform, TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
    listFiles(uri: string): Promise<Array<{ name: string; uri: string; isDirectory: boolean }>>;
    readFile(uri: string, encoding: string): Promise<string>;
    exists(uri: string): Promise<boolean>;
}

let spec
if (Platform.OS==='android')
    spec = TurboModuleRegistry.getEnforcing<Spec>('SAF');
export default spec
