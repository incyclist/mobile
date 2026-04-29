#import <React/RCTBridgeModule.h>

RCT_EXTERN_MODULE(SAFModule, NSObject)

RCT_EXTERN_METHOD(listFiles:(NSString *)uri
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(readFile:(NSString *)uri
                  encoding:(NSString *)encoding
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(exists:(NSString *)uri
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
