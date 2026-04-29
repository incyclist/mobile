import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
    listFiles(uri: string): Promise<Array<{ name: string; uri: string; isDirectory: boolean }>>;
    readFile(uri: string, encoding: string): Promise<string>;
    exists(uri: string): Promise<boolean>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SAF');
