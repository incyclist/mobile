#import "RCTStreetViewComponentView.h"

#import <react/renderer/components/AppSpec/ComponentDescriptors.h>
#import <react/renderer/components/AppSpec/EventEmitters.h>
#import <react/renderer/components/AppSpec/Props.h>
#import <react/renderer/components/AppSpec/RCTComponentViewHelpers.h>

using namespace facebook::react;

/**
 * RCTStreetViewComponentView — M1 skeleton.
 *
 * ── What this is ──────────────────────────────────────────────────────────
 *
 * This milestone contains NO Google Maps SDK code. It is a placeholder view
 * that renders a solid colour and emits diagnostics, and its only job is to
 * prove the parts that have never existed on iOS in this project before:
 *
 *   - Codegen produced AppSpec artefacts for "StreetView" on iOS
 *   - componentProvider maps the JS component to this class
 *   - the C++ event emitter reaches StreetView.tsx's onLog handler
 *   - log buffering works, i.e. an event raised before the view is mounted
 *     is not silently dropped
 *
 * If the ride screen shows a coloured rectangle instead of Fabric's
 * "Unimplemented component" placeholder, and 'streetview native' lines appear
 * in the app's event log, all four hold and M2 can add GMSPanoramaView with
 * confidence that a failure then is the SDK's and not the wiring's.
 *
 * ── Contract ──────────────────────────────────────────────────────────────
 *
 * The behaviour this must eventually reproduce is defined by the Android
 * implementation, not by this file:
 *   android/app/src/main/java/com/incyclist/app/StreetViewManager.kt
 *
 * StreetView.tsx must work against iOS unchanged, so no event may be renamed,
 * reordered or added here.
 *
 * ── Logging ───────────────────────────────────────────────────────────────
 *
 * Nothing diagnostic goes to NSLog. Users hitting Street View problems cannot
 * retrieve device logs from an iPhone, so anything visible only in Xcode or
 * Console.app is invisible in practice — the same rule the Android side
 * follows, and the reason its onLog exists at all.
 *
 * The one exception is a failure of the event pipeline itself: an event cannot
 * report that events are broken.
 */
@interface RCTStreetViewComponentView () <RCTStreetViewViewProtocol>
@end

@implementation RCTStreetViewComponentView {
    /**
     * Logs raised before the view has an event emitter.
     *
     * _eventEmitter is null between init and mount, and the createView log —
     * the one that will carry API-key state from M2 onwards — is raised in
     * exactly that window. Dropping it would recreate the Android situation
     * where an empty key produced no explanation anywhere.
     */
    NSMutableArray<NSDictionary *> *_pendingLogs;

    /** Placeholder for the panorama view that arrives in M2. */
    UIView *_placeholder;

    /** Last position handed down, for change detection and logging. */
    double _latitude;
    double _longitude;
    double _heading;
    BOOL _hasPosition;
}

#pragma mark - Fabric plumbing

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
    return concreteComponentDescriptorProvider<StreetViewComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame
{
    if (self = [super initWithFrame:frame]) {
        static const auto defaultProps = std::make_shared<const StreetViewProps>();
        _props = defaultProps;

        _pendingLogs = [NSMutableArray new];
        [self resetState];

        // Deliberately garish. This view is invisible in the ride screen if it
        // fails to register — a distinctive colour makes "the component is
        // live" unambiguous at a glance on a device, without reading a log.
        _placeholder = [[UIView alloc] initWithFrame:self.bounds];
        _placeholder.backgroundColor = [UIColor colorWithRed:0.0
                                                       green:0.45
                                                        blue:0.70
                                                       alpha:1.0];
        [self addSubview:_placeholder];

        [self emitLog:@"createView"
               detail:@{
                   @"milestone": @"M1",
                   @"note": @"placeholder, no Maps SDK",
                   @"width": @(frame.size.width),
                   @"height": @(frame.size.height),
               }];
    }
    return self;
}

- (void)layoutSubviews
{
    [super layoutSubviews];
    _placeholder.frame = self.bounds;
}

/**
 * First point at which events can actually be delivered. Anything logged
 * before this was buffered; release it now.
 */
- (void)updateEventEmitter:(const EventEmitter::Shared &)eventEmitter
{
    [super updateEventEmitter:eventEmitter];
    [self flushPendingLogs];
}

/**
 * Fabric recycles component views: this instance is pooled on unmount and
 * handed to the NEXT StreetView that mounts. Android has no equivalent —
 * onDropViewInstance really is the end of a view there.
 *
 * Every piece of per-instance state must therefore be cleared here. From M2
 * this includes the licenseConsumed flag, and getting that wrong would mean
 * the second Street View ride of a session never emits onLoaded — so
 * StreetView.tsx would never dismiss its start overlay, on the second ride
 * only. Resetting unconditionally is much cheaper than diagnosing that.
 */
- (void)prepareForRecycle
{
    [self resetState];
    [_pendingLogs removeAllObjects];
    [super prepareForRecycle];
}

- (void)resetState
{
    _latitude = 0;
    _longitude = 0;
    _heading = 0;
    _hasPosition = NO;
}

#pragma mark - Props

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
    const auto &newViewProps = *std::static_pointer_cast<StreetViewProps const>(props);

    const BOOL positionChanged =
        !_hasPosition ||
        newViewProps.latitude  != _latitude ||
        newViewProps.longitude != _longitude ||
        newViewProps.heading   != _heading;

    if (positionChanged) {
        _latitude   = newViewProps.latitude;
        _longitude  = newViewProps.longitude;
        _heading    = newViewProps.heading;
        _hasPosition = YES;

        // From M2 this drives moveNearCoordinate:. Here it only demonstrates
        // that props arrive and that their values are what StreetView.tsx sent.
        [self emitLog:@"position"
               detail:@{
                   @"lat": @(_latitude),
                   @"lng": @(_longitude),
                   @"heading": @(_heading),
                   @"readyTimeout": @(newViewProps.readyTimeout),
                   @"positionTimeout": @(newViewProps.positionTimeout),
               }];
    }

    [super updateProps:props oldProps:oldProps];
}

#pragma mark - Events

- (void)emitLog:(NSString *)message detail:(NSDictionary *)detail
{
    NSDictionary *payload = @{ @"message": message, @"detail": [self jsonString:detail] };

    if (!_eventEmitter) {
        [_pendingLogs addObject:payload];
        return;
    }

    [self flushPendingLogs];
    [self sendLog:payload];
}

- (void)flushPendingLogs
{
    if (!_eventEmitter || _pendingLogs.count == 0) {
        return;
    }

    NSArray<NSDictionary *> *buffered = [_pendingLogs copy];
    [_pendingLogs removeAllObjects];

    for (NSDictionary *payload in buffered) {
        [self sendLog:payload];
    }
}

- (void)sendLog:(NSDictionary *)payload
{
    if (!_eventEmitter) {
        return;
    }

    @try {
        const auto &emitter = static_cast<const StreetViewEventEmitter &>(*_eventEmitter);
        emitter.onLog(StreetViewEventEmitter::OnLog{
            .message = std::string([payload[@"message"] UTF8String] ?: ""),
            .detail  = std::string([payload[@"detail"]  UTF8String] ?: ""),
        });
    } @catch (NSException *e) {
        // The one NSLog in this file, for the reason given at the top: an
        // event cannot report that the event pipeline is broken.
        NSLog(@"[StreetView] emitting onLog threw: %@", e.reason);
    }
}

/**
 * `detail` travels as a JSON string so the Codegen surface stays fixed no
 * matter what the native side wants to report. StreetView.tsx parses it and
 * spreads the result into the event log; an unparseable value degrades to a
 * plain string there rather than being lost.
 */
- (NSString *)jsonString:(NSDictionary *)detail
{
    if (detail.count == 0) {
        return @"";
    }

    NSError *error = nil;
    NSData *data = [NSJSONSerialization dataWithJSONObject:detail options:0 error:&error];
    if (!data || error) {
        return @"";
    }

    return [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding] ?: @"";
}

@end

/**
 * Referenced by the generated component provider (codegenConfig.ios.
 * componentProvider in package.json) to resolve "StreetView" to this class.
 */
Class<RCTComponentViewProtocol> StreetViewCls(void)
{
    return RCTStreetViewComponentView.class;
}
