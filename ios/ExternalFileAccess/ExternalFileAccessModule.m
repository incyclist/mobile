#import <React/RCTBridgeModule.h>

/**
 * ExternalFileAccess — Objective-C bridge header
 *
 * Exposes the Swift ExternalFileAccessModule to the React Native bridge.
 * The actual implementation is in ExternalFileAccessModule.swift.
 *
 * The selectors below must stay identical to the @objc(...) names in the Swift file
 * and to the method names in src/specs/NativeExternalFileAccess.ts.
 */
@interface RCT_EXTERN_MODULE(ExternalFileAccess, NSObject)

RCT_EXTERN_METHOD(
    activateGrant:(NSString *)grant
    resolve:(RCTPromiseResolveBlock)resolve
    reject:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
    deactivateGrant:(NSString *)resolvedPath
    resolve:(RCTPromiseResolveBlock)resolve
    reject:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
    captureGrant:(NSString *)folderPath
    resolve:(RCTPromiseResolveBlock)resolve
    reject:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
    checkAccess:(NSString *)path
    resolve:(RCTPromiseResolveBlock)resolve
    reject:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
    getAvailability:(NSString *)path
    resolve:(RCTPromiseResolveBlock)resolve
    reject:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
    startDownload:(NSString *)path
    resolve:(RCTPromiseResolveBlock)resolve
    reject:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
    evict:(NSString *)path
    resolve:(RCTPromiseResolveBlock)resolve
    reject:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
    isCloudIdentityAvailable:(RCTPromiseResolveBlock)resolve
    reject:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
    debugIdentityTokenPresent:(RCTPromiseResolveBlock)resolve
    reject:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
    getPrivateDir:(NSString *)name
    resolve:(RCTPromiseResolveBlock)resolve
    reject:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
    copyFile:(NSString *)sourcePath
    targetPath:(NSString *)targetPath
    resolve:(RCTPromiseResolveBlock)resolve
    reject:(RCTPromiseRejectBlock)reject
)

@end
