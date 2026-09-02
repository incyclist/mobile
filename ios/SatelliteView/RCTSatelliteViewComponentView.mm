#import "RCTSatelliteViewComponentView.h"

#import <MapKit/MapKit.h>

#import <react/renderer/components/AppSpec/ComponentDescriptors.h>
#import <react/renderer/components/AppSpec/EventEmitters.h>
#import <react/renderer/components/AppSpec/Props.h>
#import <react/renderer/components/AppSpec/RCTComponentViewHelpers.h>

using namespace facebook::react;

/**
 * RCTSatelliteViewComponentView — Fabric native view component (iOS)
 *
 * Apple MapKit satellite imagery for the ride screen's 'sat' view. The behavioural
 * reference is desktop's GoogleSatelliteView (web-ui), not the Android component:
 * the two mobile platforms use different imagery providers by design
 * (satellite-view-mobile-design.md 2.1), and only the JS-visible event contract is
 * shared between them.
 *
 * Structurally this file mirrors ios/StreetView/RCTStreetViewComponentView.mm —
 * buffered logging, generation-token timeouts, full teardown in prepareForRecycle —
 * because those are properties of being a Fabric component on iOS, not of Street
 * View. None of Street View's Google-SDK cost centres apply here: MapKit is a
 * first-party framework, so there is no CocoaPods dependency, no API key, no
 * min-iOS bump and nothing to bill.
 *
 * ── Event contract ────────────────────────────────────────────────────────
 *
 * onLoaded   Once per view lifetime, carrying elapsed-since-first-position. The
 *            ride start overlay stays up until the service sees it
 *            (satellite-view-mobile-design.md 2.9), so it must always arrive —
 *            see "Guaranteed onLoaded" below.
 *
 * onError    reason='unavailable'  MKMapView reported it could not load the map
 *                                  (typically no network for the tiles).
 *            reason='unknown'      any other failure, currently only a nil-error
 *                                  load failure.
 *            An error does NOT withhold onLoaded — see below.
 *
 * onLog      Diagnostics. See "Logging".
 *
 * Deliberately absent, both by design (satellite-view-mobile-design.md 2.8):
 *
 *   onLicenseConsumed   Google bills per GMSPanoramaView instantiation, which is
 *                       what Street View's event counts. Apple has no comparable
 *                       per-load billing or quota event for MapKit, so there is
 *                       nothing here for such an event to represent. Omitted
 *                       rather than stubbed, so an always-zero counter never
 *                       reaches the dashboards and gets read as a regression.
 *
 *   onNoPanorama        There is no "no imagery at this position" state for a
 *                       tile-based satellite map. Every coordinate on earth
 *                       renders something.
 *
 * ── Guaranteed onLoaded ───────────────────────────────────────────────────
 *
 * GPX/View.tsx renders this component behind the start overlay so the map can
 * load while the rider still sees the overlay, and the service lifts the overlay
 * on 'Loaded'. A load that never reports completion would therefore leave the
 * rider stuck on the overlay — the exact failure Street View already had once.
 *
 * So onLoaded is sent on whichever of these happens first:
 *
 *   mapViewDidFinishLoadingMap:        tiles for the current region arrived
 *   mapViewDidFinishRenderingMap:      something was actually painted
 *   mapViewDidFailLoadingMap:          nothing will paint; onError is sent too
 *   kLoadTimeoutMs elapsed             no delegate callback of any kind
 *
 * The last two matter most. Trading a blank map for a start overlay that never
 * lifts would be a far worse bug than the one being avoided, so onLoaded goes
 * out regardless and the log records which path took it. The service has its own
 * start-timeout as a second net; this one exists so the component is honest on
 * its own.
 *
 * ── Hidden until ready to serve ───────────────────────────────────────────
 *
 * The map view is created hidden and revealed at exactly the moment onLoaded is
 * sent, matching Street View. "Loaded" means ready to serve, and that is when
 * the view should appear — otherwise the rider briefly sees MapKit's empty grid
 * background before the first tiles arrive.
 *
 * ── Update cadence ────────────────────────────────────────────────────────
 *
 * Every position prop is applied as it arrives. There is no throttling here and
 * none in the service either (satellite-view-mobile-design.md 2.11): unlike
 * Street View, where each position triggers a network panorama fetch, moving the
 * camera over an already-loaded tile map IS the update — there is no expensive
 * operation to throttle against.
 *
 * Updates are animated over kCameraAnimationDurationS rather than jumped, so a
 * ~1Hz position stream interpolates smoothly instead of stepping. The first
 * position is applied instantly: animating it would fly the camera across the
 * globe from MapKit's default region.
 *
 * ── Logging ───────────────────────────────────────────────────────────────
 *
 * Nothing diagnostic goes to NSLog. Riders who hit problems cannot retrieve logs
 * from an iPhone, so anything visible only in Xcode or Console.app is invisible
 * in practice — the same rule, and the same reason, as Street View
 * (ios-streetview-design.md 6). Everything goes out as onLog and
 * SatelliteView.tsx writes it to the app's event log.
 *
 * The single exception is a failure of the event pipeline itself: an event
 * cannot report that events are broken.
 *
 * Events raised before the view is mounted are buffered, because _eventEmitter
 * is null between init and mount — and createView, the line that records the
 * view's size and map type, is raised in exactly that window.
 *
 * ── View recycling ────────────────────────────────────────────────────────
 *
 * Fabric pools component views on iOS: this instance is handed to the NEXT
 * SatelliteView that mounts. prepareForRecycle therefore tears the map down and
 * resets every flag. Leaking _loadedEmitted across a recycle would mean the
 * second satellite ride of a session emits no onLoaded at all, so the start
 * overlay would never lift — on the second ride only, which is an expensive bug
 * to find from a user report.
 */

// ── Constants ─────────────────────────────────────────────────────────────

/**
 * Desktop's GoogleSatelliteView uses mapTypeId 'satellite', which in the Google
 * Maps JS API is imagery only — 'hybrid' is the one that overlays roads and
 * labels. MKMapTypeSatellite is the matching MapKit constant; MKMapTypeHybrid
 * would be the labelled equivalent.
 *
 * Not visually confirmed against desktop side by side — that needs a device
 * build. If labels turn out to be wanted, this one constant is the whole change.
 */
static const MKMapType kMapType = MKMapTypeSatellite;
static NSString *const kMapTypeName = @"satellite";

/**
 * Fixed camera pitch, matching desktop's tilt:45 (satellite-view-mobile-design.md
 * 2.4). Gestures are disabled, so the rider cannot change it.
 */
static const CGFloat kCameraPitchDegrees = 45;

/**
 * Distance from the camera to the point it looks at, in metres — MapKit's
 * equivalent of a zoom level, which it has no direct notion of.
 *
 * Desktop uses Google zoom 20. At that zoom a phone-width viewport covers on the
 * order of 100m of ground, and this value is chosen to land in the same
 * neighbourhood. It is an approximation of a different projection under a tilted
 * camera, so treat it as a starting point to tune on device against desktop,
 * exactly as the design leaves the animation duration open.
 */
static const CLLocationDistance kCameraDistanceMeters = 250;

/**
 * How long a camera move takes. The design suggests roughly the update cadence
 * (~800ms–1s) so consecutive ~1Hz updates interpolate rather than step, and
 * explicitly leaves the exact value to be tuned against observed jankiness on
 * device rather than fixed in advance.
 */
static const NSTimeInterval kCameraAnimationDurationS = 0.9;

/**
 * Backstop for onLoaded. See "Guaranteed onLoaded" — this exists so a MapKit
 * instance that never reports loading or rendering can never hang the start
 * overlay. Deliberately not a JS prop: it is a correctness floor, not a tuning
 * knob.
 */
static const double kLoadTimeoutMs = 8000;

// ── Component ─────────────────────────────────────────────────────────────

@interface RCTSatelliteViewComponentView () <RCTSatelliteViewViewProtocol, MKMapViewDelegate>
@end

@implementation RCTSatelliteViewComponentView {
    MKMapView *_mapView;

    /** The single rider pin. One plain annotation, no avatar and no other riders. */
    MKPointAnnotation *_positionAnnotation;

    /** Events raised before _eventEmitter exists. See "Logging". */
    NSMutableArray<NSDictionary *> *_pendingLogs;
    NSString *_pendingErrorReason;

    /** onLoaded is sent exactly once per view lifetime. */
    BOOL _loadedEmitted;

    double _latitude;
    double _longitude;
    double _heading;
    BOOL   _hasPosition;

    /** When the first position was applied — onLoaded reports elapsed against it. */
    NSDate *_firstPositionAt;

    /**
     * Generation counter instead of NSTimer: the load timeout is cancelled by
     * bumping the token, so a dispatch_after block that has already been
     * scheduled simply finds itself stale and returns. No invalidation, no
     * retain cycles, and nothing can fire after teardown.
     */
    int64_t _loadToken;
}

#pragma mark - Fabric plumbing

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
    return concreteComponentDescriptorProvider<SatelliteViewComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame
{
    if (self = [super initWithFrame:frame]) {
        static const auto defaultProps = std::make_shared<const SatelliteViewProps>();
        _props = defaultProps;

        _pendingLogs = [NSMutableArray new];
        [self resetState];

        // A zero-sized surface is a plausible reason for a map never to load, so
        // the size the view was created with is worth having in the log.
        [self emitLog:@"createView" detail:@{
            @"mapType": kMapTypeName,
            @"pitch": @(kCameraPitchDegrees),
            @"distance": @(kCameraDistanceMeters),
            @"width": @(frame.size.width),
            @"height": @(frame.size.height),
        }];
    }
    return self;
}

- (void)dealloc
{
    [self teardownMap];
}

- (void)layoutSubviews
{
    [super layoutSubviews];
    _mapView.frame = self.bounds;
}

- (void)updateEventEmitter:(const EventEmitter::Shared &)eventEmitter
{
    [super updateEventEmitter:eventEmitter];
    [self flushPending];
}

- (void)prepareForRecycle
{
    [self emitLog:@"prepareForRecycle" detail:@{@"loaded": @(_loadedEmitted)}];

    [self teardownMap];
    [self resetState];
    [_pendingLogs removeAllObjects];
    _pendingErrorReason = nil;
    [super prepareForRecycle];
}

- (void)resetState
{
    _loadedEmitted   = NO;
    _latitude        = 0;
    _longitude       = 0;
    _heading         = 0;
    _hasPosition     = NO;
    _firstPositionAt = nil;
    _loadToken++;   // invalidate anything still scheduled
}

#pragma mark - Map lifecycle

/**
 * Created lazily on the first position rather than in init: an MKMapView added to
 * the hierarchy starts loading tiles immediately, and doing that before a
 * position is known would fetch the default world region and then throw it away.
 * A recycled view that is never used again also costs nothing this way.
 */
- (void)ensureMap
{
    if (_mapView != nil) {
        return;
    }

    _mapView = [[MKMapView alloc] initWithFrame:self.bounds];
    _mapView.delegate = self;
    _mapView.mapType  = kMapType;

    // Revealed only once onLoaded is sent — see "Hidden until ready to serve".
    _mapView.hidden = YES;

    // Fixed, non-interactive camera (satellite-view-mobile-design.md 2.4): the
    // rider must not be able to pan, zoom or rotate the view off the route while
    // riding, and the pitch is part of the intended look rather than a default.
    _mapView.scrollEnabled = NO;
    _mapView.zoomEnabled   = NO;
    _mapView.rotateEnabled = NO;
    _mapView.pitchEnabled  = NO;

    // Nothing on top of the imagery: desktop sets disableDefaultUI.
    _mapView.showsCompass      = NO;
    _mapView.showsScale        = NO;
    _mapView.showsUserLocation = NO;

    [self addSubview:_mapView];

    [self emitLog:@"map created" detail:@{
        @"width": @(self.bounds.size.width),
        @"height": @(self.bounds.size.height),
    }];

    [self armLoadTimeout];
}

- (void)teardownMap
{
    _loadToken++;

    if (_mapView) {
        _mapView.delegate = nil;
        if (_positionAnnotation) {
            [_mapView removeAnnotation:_positionAnnotation];
        }
        [_mapView removeFromSuperview];
        _mapView = nil;
    }
    _positionAnnotation = nil;
}

/**
 * Guarantees onLoaded even if MapKit reports nothing at all. Without it, a map
 * that silently fails to engage would leave the start overlay up for the whole
 * ride.
 */
- (void)armLoadTimeout
{
    const int64_t token = ++_loadToken;

    __weak __typeof(self) weakSelf = self;
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(kLoadTimeoutMs * NSEC_PER_MSEC)),
                   dispatch_get_main_queue(), ^{
        __typeof(self) strongSelf = weakSelf;
        if (!strongSelf || strongSelf->_loadToken != token) {
            return;  // cancelled, superseded, or the view is gone
        }
        [strongSelf emitLog:@"load timeout expired" detail:@{
            @"timeout": @(kLoadTimeoutMs),
            @"note": @"map never reported loading or rendering; releasing the overlay anyway",
        }];
        [strongSelf emitLoadedOnce:@"load-timeout"];
    });
}

#pragma mark - Props

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
    const auto &next = *std::static_pointer_cast<SatelliteViewProps const>(props);

    const BOOL isFirst = !_hasPosition;
    const BOOL changed = isFirst || next.latitude != _latitude || next.longitude != _longitude
                          || next.heading != _heading;

    _latitude    = next.latitude;
    _longitude   = next.longitude;
    _heading     = next.heading;
    _hasPosition = YES;

    [self ensureMap];

    // Every changed position is applied as it arrives — no throttling, here or in
    // the service (satellite-view-mobile-design.md 2.11).
    if (changed) {
        [self applyPositionAnimated:!isFirst];
    }

    [super updateProps:props oldProps:oldProps];
}

/**
 * The first position is applied instantly: animating it would fly the camera
 * across the globe from MapKit's default region while the start overlay is up.
 * Every later position animates, so a ~1Hz stream interpolates smoothly.
 */
- (void)applyPositionAnimated:(BOOL)animated
{
    if (!_mapView) {
        return;
    }

    const CLLocationCoordinate2D coordinate = CLLocationCoordinate2DMake(_latitude, _longitude);

    if (!_firstPositionAt) {
        _firstPositionAt = [NSDate date];
    }

    MKMapCamera *camera = [MKMapCamera cameraLookingAtCenterCoordinate:coordinate
                                                          fromDistance:kCameraDistanceMeters
                                                                 pitch:kCameraPitchDegrees
                                                               heading:_heading];

    if (animated) {
        // MKMapView has no camera API that takes a duration: setCamera:animated:
        // animates for a length MapKit chooses. Driving the assignment from a
        // UIView animation block is how a specific duration is applied. If that
        // turns out not to take effect on device the camera simply jumps, which
        // is a smoothness regression and not a functional one — the fallback is
        // setCamera:camera animated:YES.
        [UIView animateWithDuration:kCameraAnimationDurationS
                              delay:0
                            options:UIViewAnimationOptionCurveLinear |
                                    UIViewAnimationOptionBeginFromCurrentState |
                                    UIViewAnimationOptionAllowUserInteraction
                         animations:^{
            [self->_mapView setCamera:camera animated:NO];
        }
                         completion:nil];
    } else {
        [_mapView setCamera:camera animated:NO];
    }

    [self applyAnnotationAt:coordinate];

    [self emitLog:@"position applied" detail:@{
        @"lat": @(_latitude),
        @"lng": @(_longitude),
        @"heading": @(_heading),
        @"animated": @(animated),
        @"duration": @(animated ? kCameraAnimationDurationS : 0),
        @"loaded": @(_loadedEmitted),
    }];
}

/**
 * One plain MKPointAnnotation for the current rider, replicating desktop exactly:
 * no avatar icon and no other riders (satellite-view-mobile-design.md 2.12). No
 * MKAnnotationView is supplied, so MapKit draws its own default pin — which is
 * what desktop's plain Google Maps Marker is.
 *
 * The annotation is created once and moved, not removed and re-added: reassigning
 * coordinate animates the pin, while a remove/add pair would make it blink on
 * every position update.
 */
- (void)applyAnnotationAt:(CLLocationCoordinate2D)coordinate
{
    if (!_positionAnnotation) {
        _positionAnnotation = [MKPointAnnotation new];
        _positionAnnotation.coordinate = coordinate;
        [_mapView addAnnotation:_positionAnnotation];
        return;
    }
    _positionAnnotation.coordinate = coordinate;
}

#pragma mark - MKMapViewDelegate

- (void)mapViewWillStartLoadingMap:(MKMapView *)mapView
{
    [self emitLog:@"willStartLoadingMap" detail:@{}];
}

/** Tiles for the current region arrived. The primary onLoaded trigger. */
- (void)mapViewDidFinishLoadingMap:(MKMapView *)mapView
{
    [self emitLog:@"didFinishLoadingMap" detail:@{@"loaded": @(_loadedEmitted)}];
    [self emitLoadedOnce:@"loaded"];
}

/**
 * Nothing will paint. onError says so, and onLoaded still goes out so the start
 * overlay lifts onto whatever MapKit shows for an unloadable map rather than
 * staying up for the rest of the ride — see "Guaranteed onLoaded".
 *
 * `error` is nil-checked despite its annotation, on the same principle Street
 * View documents: a wrong nullability annotation is inert in Objective-C only if
 * the code actually checks.
 */
- (void)mapViewDidFailLoadingMap:(MKMapView *)mapView withError:(NSError *)error
{
    [self emitLog:@"didFailLoadingMap" detail:@{
        @"errorWasNil": @(error == nil),
        @"domain": error.domain ?: @"",
        @"code": @(error.code),
        @"description": error.localizedDescription ?: @"",
        @"loaded": @(_loadedEmitted),
    }];

    // A load failure is almost always the tiles being unreachable; 'unknown' is
    // kept for the case where MapKit does not say what went wrong at all.
    [self emitError:error ? @"unavailable" : @"unknown"];
    [self emitLoadedOnce:@"load-failed"];
}

/**
 * Fires whenever rendering settles, so it can arrive repeatedly and can arrive
 * before didFinishLoadingMap. Treated as a second onLoaded trigger — something
 * was painted, which is the thing the start overlay is actually waiting for —
 * and as a diagnostic thereafter.
 */
- (void)mapViewDidFinishRenderingMap:(MKMapView *)mapView fullyRendered:(BOOL)fullyRendered
{
    if (!_loadedEmitted) {
        [self emitLog:@"didFinishRenderingMap" detail:@{@"fullyRendered": @(fullyRendered)}];
        [self emitLoadedOnce:@"rendered"];
    }
}

#pragma mark - Event emission

/**
 * `reason` records which path released the overlay — loaded, rendered,
 * load-failed or load-timeout. Without it a slow first load and a broken MapKit
 * look identical in the event log.
 */
- (void)emitLoadedOnce:(NSString *)reason
{
    if (_loadedEmitted) return;
    _loadedEmitted = YES;
    _loadToken++;   // the safety timeout has done its job

    // Ready to serve and visible are the same moment — see "Hidden until ready
    // to serve". Covers all four reasons without any of them special-casing it.
    _mapView.hidden = NO;

    [self emitLog:@"loaded" detail:@{
        @"reason": reason,
        @"elapsed": @(_firstPositionAt ? [[NSDate date] timeIntervalSinceDate:_firstPositionAt] * 1000 : -1),
    }];

    if (!_eventEmitter) return;
    @try {
        [self emitter].onLoaded({});
    } @catch (NSException *e) {
        NSLog(@"[SatelliteView] onLoaded threw: %@", e.reason);
    }
}

- (void)emitError:(NSString *)reason
{
    if (!_eventEmitter) {
        _pendingErrorReason = reason;
        return;
    }
    @try {
        [self emitter].onError({.reason = std::string(reason.UTF8String ?: "")});
    } @catch (NSException *e) {
        NSLog(@"[SatelliteView] onError threw: %@", e.reason);
    }
}

- (void)emitLog:(NSString *)message detail:(NSDictionary *)detail
{
    NSDictionary *payload = @{ @"message": message, @"detail": [self jsonString:detail] };

    if (!_eventEmitter) {
        [_pendingLogs addObject:payload];
        return;
    }

    [self flushPending];
    [self sendLog:payload];
}

- (void)flushPending
{
    if (!_eventEmitter) return;

    if (_pendingLogs.count > 0) {
        NSArray<NSDictionary *> *buffered = [_pendingLogs copy];
        [_pendingLogs removeAllObjects];
        for (NSDictionary *payload in buffered) {
            [self sendLog:payload];
        }
    }

    if (_pendingErrorReason) {
        NSString *reason = _pendingErrorReason;
        _pendingErrorReason = nil;
        [self emitError:reason];
    }
}

- (void)sendLog:(NSDictionary *)payload
{
    if (!_eventEmitter) return;
    @try {
        [self emitter].onLog(SatelliteViewEventEmitter::OnLog{
            .message = std::string([payload[@"message"] UTF8String] ?: ""),
            .detail  = std::string([payload[@"detail"]  UTF8String] ?: ""),
        });
    } @catch (NSException *e) {
        // The one NSLog in this file, for the reason given at the top: an event
        // cannot report that the event pipeline is broken.
        NSLog(@"[SatelliteView] emitting onLog threw: %@", e.reason);
    }
}

- (const SatelliteViewEventEmitter &)emitter
{
    return static_cast<const SatelliteViewEventEmitter &>(*_eventEmitter);
}

/**
 * `detail` travels as a JSON string so the Codegen surface stays fixed whatever
 * the native side wants to report. SatelliteView.tsx parses it and spreads the
 * result into the event log; an unparseable value degrades to a plain string
 * there rather than being lost.
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
 * Referenced by the generated component provider
 * (codegenConfig.ios.componentProvider in package.json) to resolve "SatelliteView"
 * to this class.
 */
Class<RCTComponentViewProtocol> SatelliteViewCls(void)
{
    return RCTSatelliteViewComponentView.class;
}
