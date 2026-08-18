import { FormattedNumber } from 'incyclist-services';

export const isFormattedNumber = (v: unknown): v is FormattedNumber =>
    typeof v === 'object' && v !== null && 'value' in v
    && typeof (v as { value: unknown }).value === 'number' && !Number.isNaN((v as { value: number }).value);
