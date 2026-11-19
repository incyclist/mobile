import { createMMKV } from 'react-native-mmkv';
import { KeyValueStore, LogDeliveryMarker } from './sessionRecord';

const STORAGE_ID = 'session_diagnostics';

let store: KeyValueStore | undefined;
let marker: LogDeliveryMarker | undefined;

export const getDiagnosticsStore = (): KeyValueStore => {
    store = store ?? createMMKV({ id: STORAGE_ID });
    return store;
};

/**
 * Called by the REST log adapter after a batch was accepted by the backend. Kept free of any
 * dependency on the logging services so the adapter can import it without a cycle.
 */
export const markLogDelivered = (): void => {
    try {
        marker = marker ?? new LogDeliveryMarker(getDiagnosticsStore());
        marker.markDelivered();
    } catch {
        // ignore
    }
};
