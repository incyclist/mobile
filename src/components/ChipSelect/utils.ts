import { ChipOption, NormalizedChipOption } from './types';

/**
 * Normalizes a ChipOption (either a plain string or a richer object) into a
 * consistent shape the component can render uniformly.
 *
 * Plain strings (the pre-existing contract) become `{ label }` with no
 * `disabled`/`message` — this keeps every existing string-based caller
 * behaving exactly as before.
 */
export const normalizeChipOption = (option: ChipOption): NormalizedChipOption =>
    typeof option === 'string' ? { label: option } : option;
