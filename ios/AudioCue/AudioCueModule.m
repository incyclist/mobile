#import <React/RCTBridgeModule.h>

/**
 * AudioCue — Objective-C bridge header
 *
 * Exposes the Swift AudioCueModule to the React Native bridge.
 * The actual implementation is in AudioCueModule.swift.
 */
@interface RCT_EXTERN_MODULE(AudioCue, NSObject)

RCT_EXTERN_METHOD(
    play:(nonnull NSNumber *)frequencyHz
    durationMs:(nonnull NSNumber *)durationMs
)

@end
