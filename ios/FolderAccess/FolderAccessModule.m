#import <React/RCTBridgeModule.h>

/**
 * FolderAccess — Objective-C bridge header
 *
 * Exposes the Swift FolderAccessModule to the React Native bridge.
 * The actual implementation is in FolderAccessModule.swift.
 */
@interface RCT_EXTERN_MODULE(FolderAccess, NSObject)

RCT_EXTERN_METHOD(
    listFiles:(NSString *)uri
    resolve:(RCTPromiseResolveBlock)resolve
    reject:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
    readFile:(NSString *)uri
    encoding:(NSString *)encoding
    resolve:(RCTPromiseResolveBlock)resolve
    reject:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
    exists:(NSString *)uri
    resolve:(RCTPromiseResolveBlock)resolve
    reject:(RCTPromiseRejectBlock)reject
)

@end
