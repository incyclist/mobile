import { isServerMisconfiguredError } from './isServerMisconfiguredError';

describe('isServerMisconfiguredError', () => {
    test('recognizes AVErrorServerIncorrectlyConfigured', () => {
        expect(isServerMisconfiguredError({ error: { domain: 'AVFoundationErrorDomain', code: -11850 } })).toBe(true);
    });

    test('ignores other AVFoundation codes', () => {
        expect(isServerMisconfiguredError({ error: { domain: 'AVFoundationErrorDomain', code: -11800 } })).toBe(false);
    });

    test('ignores the same code in another domain', () => {
        expect(isServerMisconfiguredError({ error: { domain: 'NSURLErrorDomain', code: -11850 } })).toBe(false);
    });

    test('ignores Android errors and missing data', () => {
        expect(isServerMisconfiguredError({ error: { errorCode: '22004', errorString: 'ERROR_CODE_IO_BAD_HTTP_STATUS' } })).toBe(false);
        expect(isServerMisconfiguredError(undefined)).toBe(false);
    });
});
