#import <React/RCTBridgeModule.h>

/**
 * NativeCapabilities - Objective-C bridge
 *
 * Exposes the Swift NativeCapabilitiesModule to the React Native bridge. JS reads the
 * constants synchronously as NativeModules.NativeCapabilities.capabilities.
 */
@interface RCT_EXTERN_MODULE(NativeCapabilities, NSObject)
@end
