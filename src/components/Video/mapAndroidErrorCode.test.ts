import { mapAndroidErrorCode } from './mapAndroidErrorCode';

// W3C MediaError codes, matching what the shared RLVDisplayService.buildVideoError
// (incyclist-services) expects.
const MEDIA_ERR_NETWORK = 2;
const MEDIA_ERR_DECODE = 3;
const MEDIA_ERR_SRC_NOT_SUPPORTED = 4;

describe('mapAndroidErrorCode', () => {
    test('maps ERROR_CODE_IO_BAD_HTTP_STATUS (22004) to MEDIA_ERR_NETWORK', () => {
        expect(mapAndroidErrorCode(22004)).toBe(MEDIA_ERR_NETWORK);
    });

    test('maps other IO/source errors (2xxx -> 22xxx) to MEDIA_ERR_NETWORK', () => {
        expect(mapAndroidErrorCode(22000)).toBe(MEDIA_ERR_NETWORK); // IO_UNSPECIFIED
        expect(mapAndroidErrorCode(22001)).toBe(MEDIA_ERR_NETWORK); // IO_NETWORK_CONNECTION_FAILED
        expect(mapAndroidErrorCode(22002)).toBe(MEDIA_ERR_NETWORK); // IO_NETWORK_CONNECTION_TIMEOUT
        expect(mapAndroidErrorCode(22999)).toBe(MEDIA_ERR_NETWORK);
    });

    test('maps parsing/container errors (3xxx -> 23xxx) to MEDIA_ERR_SRC_NOT_SUPPORTED', () => {
        expect(mapAndroidErrorCode(23001)).toBe(MEDIA_ERR_SRC_NOT_SUPPORTED); // PARSING_CONTAINER_MALFORMED
        expect(mapAndroidErrorCode(23004)).toBe(MEDIA_ERR_SRC_NOT_SUPPORTED); // PARSING_MANIFEST_UNSUPPORTED
    });

    test('maps decoder/renderer errors (4xxx-5xxx -> 24xxx-25xxx) to MEDIA_ERR_DECODE', () => {
        expect(mapAndroidErrorCode(24001)).toBe(MEDIA_ERR_DECODE); // DECODER_INIT_FAILED
        expect(mapAndroidErrorCode(24003)).toBe(MEDIA_ERR_DECODE); // DECODING_FAILED
        expect(mapAndroidErrorCode(25001)).toBe(MEDIA_ERR_DECODE); // renderer/track error range
    });

    test('leaves general errors (1xxx -> 21xxx) unmapped', () => {
        expect(mapAndroidErrorCode(21000)).toBeUndefined(); // ERROR_CODE_UNSPECIFIED
        expect(mapAndroidErrorCode(21001)).toBeUndefined(); // ERROR_CODE_TIMEOUT
    });

    test('leaves DRM errors (6xxx -> 26xxx) unmapped', () => {
        expect(mapAndroidErrorCode(26001)).toBeUndefined();
    });

    test('leaves out-of-range/unrecognized codes unmapped', () => {
        expect(mapAndroidErrorCode(0)).toBeUndefined();
        expect(mapAndroidErrorCode(1234)).toBeUndefined();
        expect(mapAndroidErrorCode(30000)).toBeUndefined();
        expect(mapAndroidErrorCode(99999)).toBeUndefined();
    });
});
