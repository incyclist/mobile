#import "RCTSAFModule.h"
#import <React/RCTBridgeModule.h>

@implementation RCTSAFModule

RCT_EXPORT_MODULE(SAF)

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
    return std::make_shared<facebook::react::NativeSAFSpecJSI>(params);
}

- (NSArray *)listFiles:(NSString *)uri {
    return @[];
}

- (NSString *)readFile:(NSString *)uri encoding:(NSString *)encoding {
    return @"";
}

- (NSNumber *)exists:(NSString *)uri {
    return @NO;
}

@end