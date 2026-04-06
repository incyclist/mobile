import { 
    useIncyclist as useIncyclistBase, 
    getRidePageService as getRidePageServiceBase 
} from 'incyclist-services';
import { SecretsStatus } from '../bindings/secret/types';

export * from './PermissionsService';
export * from './Navigation';
export * from './IncyclistApi';
export * from './RestLogging';

let currentSecretsStatus: SecretsStatus = 'missing';

/**
 * Hook to access the main Incyclist service.
 * Extended to accept initialization options including secretsStatus.
 */
export const useIncyclist = (options?: { secretsStatus?: SecretsStatus }) => {
    if (options?.secretsStatus) {
        currentSecretsStatus = options.secretsStatus;
    }
    return useIncyclistBase();
};

/**
 * Accessor for RidePageService.
 * Extended to provide getSecretsStatus() for use during page initialization.
 */
export const getRidePageService = () => {
    const service = getRidePageServiceBase();
    if (service && !(service as any).getSecretsStatus) {
        (service as any).getSecretsStatus = () => currentSecretsStatus;
    }
    return service;
};