import { MapAvailabilityBindingRN } from './binding';

export const getMapAvailabilityBinding = () => MapAvailabilityBindingRN.getInstance();

export { MapAvailabilityBindingRN };
export type {
    AvailabilityChangeCallback,
    AvailabilityResult,
    AvailabilityStatus,
    NativeMapAvailability,
    NativeMapStatus,
} from './types';
