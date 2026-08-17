#import "RCTStreetViewComponentView.h"

#import <GoogleMaps/GoogleMaps.h>

#import <react/renderer/components/AppSpec/ComponentDescriptors.h>
#import <react/renderer/components/AppSpec/EventEmitters.h>
#import <react/renderer/components/AppSpec/Props.h>
#import <react/renderer/components/AppSpec/RCTComponentViewHelpers.h>

using namespace facebook::react;

/**
 * RCTStreetViewComponentView — Fabric native view component (iOS)
 *
 * Wraps Google's GMSPanoramaView from the Maps SDK for iOS. The behavioural
 * specification is the Android implementation, not this file:
 *
 *   android/app/src/main/java/com/incyclist/app/StreetViewManager.kt
 *
 * StreetView.tsx drives both platforms unchanged, so the *sequence* of events
 * here must match Android's, not merely the event names.
 *
 * ── Event contract ────────────────────────────────────────────────────────
 *
 * onLicenseConsumed   Once per view lifetime, on the first
 *                     panoramaView:didMoveToPanorama:. This is the moment
 *                     Google charges a Dynamic Street View SKU event.
 *
 * onLoaded            Once per view lifetime. On Android this follows
 *                     onLicenseConsumed immediately; here it is deferred until
 *                     the tiles have painted. See "Deferred onLoaded".
 *
 * onNoPanorama        didMoveToPanorama: with a nil panorama — no imagery at
 *                     the requested position. Fires on the initial load and on
 *                     subsequent updates. Not an error.
 *
 * onPanoramaChanged   Non-nil didMoveToPanorama: AFTER the first load. Does not
 *                     fire on the initial load, matching Android.
 *
 * onError             reason='unknown'     the SDK never engaged: no delegate
 *                                          callback within readyTimeout, or no
 *                                          usable API key.
 *                     reason='unavailable' no response within positionTimeout
 *                                          of a moveNearCoordinate:, or the SDK
 *                                          reported an error for one.
 *
 * onLog               Diagnostics. See "Logging".
 *
 * ── Deferred onLoaded ─────────────────────────────────────────────────────
 *
 * The iOS Maps SDK shows its own loading indicator while it fetches the first
 * panorama. Android's does not — measured on device, and it appears on the
 * initial load only, never on later position changes however far they jump.
 *
 * GPX/View.tsx renders Street View *behind* the start overlay precisely so the
 * panorama can load while the rider still sees the overlay, and the service
 * lifts the overlay when 'Loaded' arrives. Sending onLoaded at the first
 * panorama change — as Android does — would therefore lift the overlay onto
 * Google's spinner. Waiting for panoramaViewDidFinishRendering: instead means
 * it lifts onto a finished panorama and the spinner is never seen.
 *
 * The event *sequence* is unchanged; only the timing of onLoaded moves later,
 * and only on iOS, to compensate for a platform difference that exists only on
 * iOS.
 *
 * Two cases deliberately do not wait, because nothing will ever paint:
 *
 *   - a first panorama change with no imagery (nil panorama)
 *   - didFinishRendering not arriving within kFirstRenderTimeoutMs
 *
 * The second is the important one. Trading a one-second spinner for a start
 * overlay that never lifts would be a far worse bug than the one being fixed,
 * so onLoaded is sent regardless once that timeout expires, and the log says
 * which path was taken.
 *
 * ── Hidden until ready to serve ───────────────────────────────────────────
 *
 * The panorama view is created hidden and revealed at exactly one moment: when
 * onLoaded is sent. "Loaded" means the component is ready to serve — not that
 * there is a panorama — so the two are the same event and the view should
 * appear precisely then.
 *
 * That gives, without special cases:
 *
 *   imagery      revealed once tiles have painted, so the start overlay lifts
 *                onto a finished panorama rather than onto Google's spinner
 *   no imagery   revealed immediately. Nothing will ever paint, so waiting
 *                would be pointless — the rider sees whatever the SDK renders
 *                for an empty position, and the service decides what to say
 *                about it from onNoPanorama
 *   timeout      revealed anyway; a permanently hidden view is worse than
 *                whatever the SDK is showing
 *
 * Android creates its view INVISIBLE and flips it VISIBLE in the ready callback
 * for the same reason.
 *
 * A route imported by a rider can begin somewhere with no Street View coverage
 * at all, and that case resolves correctly: onLoaded and onNoPanorama both
 * arrive, the start overlay lifts, and pedalling can begin. If the route later
 * reaches coverage, that fetch happens with the view already visible, so the
 * spinner may briefly appear — accepted, because it is an edge case and the
 * alternative is a component that is ready but refuses to show itself.
 *
 * ── Logging ───────────────────────────────────────────────────────────────
 *
 * Nothing diagnostic goes to NSLog. Riders who hit Street View problems cannot
 * retrieve logs from an iPhone, so anything visible only in Xcode or Console.app
 * is invisible in practice — the same rule, and the same reason, as Android.
 * Everything goes out as onLog and StreetView.tsx writes it to the app's event
 * log.
 *
 * The single exception is a failure of the event pipeline itself: an event
 * cannot report that events are broken.
 *
 * Events raised before the view is mounted are buffered, because _eventEmitter
 * is null between init and mount — and the createView log, which carries the
 * API-key state, is raised in exactly that window. Verified working at M1: it
 * arrives after 'streetview layout' despite being raised long before it.
 *
 * ── Nullability ───────────────────────────────────────────────────────────
 *
 * Every delegate argument is nil-checked regardless of how Google annotates it.
 * This is not defensive habit: fix/streetview-null-panorama-crash (c41b24c) is
 * a production crash where the Android SDK declared a listener parameter
 * @NonNull and then passed null through it as its *documented* way of saying
 * "no imagery". Kotlin's generated null-check turned the SDK behaving correctly
 * into an app crash, and the fix had to drop to Java to escape it.
 *
 * Objective-C has no such codegen, so a wrong annotation here is inert rather
 * than fatal — but only if the code actually checks. Each callback logs the
 * nullability it saw, so if the iOS SDK lies the same way, the event log says
 * so instead of the app misbehaving silently.
 *
 * ── View recycling ────────────────────────────────────────────────────────
 *
 * Fabric pools component views on iOS: this instance is handed to the NEXT
 * StreetView that mounts. Android has no equivalent. prepareForRecycle
 * therefore tears the panorama down and resets every flag — leaking
 * _licenseConsumed across a recycle would mean the second Street View ride of
 * a session emits no onLoaded at all, so the start overlay would never lift,
 * on the second ride only.
 */

// ── Constants ─────────────────────────────────────────────────────────────

/**
 * Android declares prop defaults on the view manager (@ReactProp defaultDouble),
 * so an absent prop arrives as 10000/2000 there. iOS Codegen has no equivalent:
 * an unspecified optional Double arrives as 0. Confirmed on device at M1 —
 * GPX/View.tsx passes no readyTimeout and the native side saw readyTimeout:0.
 *
 * Arming a timeout with 0 would fire it instantly and report 'unknown' before
 * the SDK had any chance, which would present as "the Maps SDK never
 * initialises on iOS". So 0 means "unset" and these are substituted.
 */
static const double kDefaultReadyTimeoutMs    = 10000;
static const double kDefaultPositionTimeoutMs = 2000;

/**
 * How long onLoaded will wait for the tiles to actually paint before being sent
 * anyway. See "Deferred onLoaded" in the class docs — this exists so a missing
 * didFinishRendering can never hang the start overlay.
 */
static const double kFirstRenderTimeoutMs = 8000;

/** Matches Android's PANORAMA_SEARCH_RADIUS. */
static const NSInteger kPanoramaSearchRadius = 50;

/** Written into the app bundle at build time by ios/scripts/write-maps-key.sh. */
static NSString *const kApiKeyResource = @"GMSApiKey";
static NSString *const kApiKeyEntry    = @"apiKey";

// ── Google Maps SDK bootstrap (process-global) ────────────────────────────

static BOOL      gServicesUsable = NO;
static NSString *gApiKeyState    = @"not-initialised";
static NSString *gProvideResult  = @"not-called";

/**
 * Reads the key without ever exposing it. Presence is reported; the value never
 * leaves this function.
 */
static NSString *ReadApiKey(void)
{
    NSString *path = [[NSBundle mainBundle] pathForResource:kApiKeyResource ofType:@"plist"];
    if (path.length == 0) {
        return nil;
    }
    NSDictionary *dict = [NSDictionary dictionaryWithContentsOfFile:path];
    id value = dict[kApiKeyEntry];
    return [value isKindOfClass:[NSString class]] ? (NSString *)value : nil;
}

/**
 * provideAPIKey: must run before any GMS class is instantiated, and only once.
 * Deliberately lazy rather than in AppDelegate: riders who never open a Street
 * View ride should not pay the SDK's startup cost.
 *
 * Two properties of the iOS SDK make this materially better than Android's
 * situation, where an empty key was accepted in silence and every panorama
 * request was then rejected with nothing anywhere saying why:
 *
 *   - provideAPIKey: returns a BOOL, so we get a direct answer and log it.
 *   - Constructing a GMSPanoramaView with no key raises an NSException. We
 *     never let that happen: with no usable key the panorama is not created at
 *     all and the component reports onError instead of crashing the ride screen.
 */
static void EnsureGoogleMapsStarted(void)
{
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        NSString *key = ReadApiKey();

        if (key.length == 0) {
            gApiKeyState    = @"missing";
            gProvideResult  = @"skipped";
            gServicesUsable = NO;
            return;
        }

        gApiKeyState = @"present";
        @try {
            BOOL ok = [GMSServices provideAPIKey:key];
            gProvideResult  = ok ? @"true" : @"false";
            gServicesUsable = ok;
        } @catch (NSException *e) {
            gProvideResult  = [NSString stringWithFormat:@"threw: %@", e.reason ?: @"unknown"];
            gServicesUsable = NO;
        }
    });
}

// ── Component ─────────────────────────────────────────────────────────────

@interface RCTStreetViewComponentView () <RCTStreetViewViewProtocol, GMSPanoramaViewDelegate>
@end

@implementation RCTStreetViewComponentView {
    GMSPanoramaView *_panoView;

    /** Events raised before _eventEmitter exists. See "Logging". */
    NSMutableArray<NSDictionary *> *_pendingLogs;
    NSString *_pendingErrorReason;

    /** First delegate callback seen — gates onLicenseConsumed. */
    BOOL _licenseConsumed;

    /** onLoaded is sent exactly once per view lifetime. */
    BOOL _loadedEmitted;

    /** Between the first panorama arriving and its tiles painting. */
    BOOL _awaitingFirstRender;
    int64_t _renderToken;


    /** Whether onError('unknown') has already been reported for a dead SDK. */
    BOOL _reportedUnusable;

    double _latitude;
    double _longitude;
    double _heading;
    BOOL   _hasPosition;

    double _readyTimeoutMs;
    double _positionTimeoutMs;

    /**
     * Generation counters instead of NSTimer: a timeout is cancelled by bumping
     * its token, so a dispatch_after block that has already been scheduled
     * simply finds itself stale and returns. No invalidation, no retain cycles,
     * and nothing can fire after teardown.
     */
    int64_t _readyToken;
    int64_t _positionToken;

    NSDate *_requestedAt;
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

        EnsureGoogleMapsStarted();

        // Mirrors Android's createViewInstance log. Whether the SDK is healthy
        // is the first question any Street View bug report has to answer, so
        // every instance reports what it is working with. The key is reported
        // as present/missing — never its value.
        [self emitLog:@"createView" detail:@{
            @"apiKey": gApiKeyState,
            @"provideAPIKey": gProvideResult,
            @"sdkVersion": [GMSServices SDKVersion] ?: @"unknown",
            @"bundleId": [[NSBundle mainBundle] bundleIdentifier] ?: @"unknown",
            @"width": @(frame.size.width),
            @"height": @(frame.size.height),
        }];
    }
    return self;
}

- (void)dealloc
{
    [self teardownPanorama];
}

- (void)layoutSubviews
{
    [super layoutSubviews];
    _panoView.frame = self.bounds;
}

- (void)updateEventEmitter:(const EventEmitter::Shared &)eventEmitter
{
    [super updateEventEmitter:eventEmitter];
    [self flushPending];
}

- (void)prepareForRecycle
{
    [self teardownPanorama];
    [self resetState];
    [_pendingLogs removeAllObjects];
    _pendingErrorReason = nil;
    [super prepareForRecycle];
}

- (void)resetState
{
    _licenseConsumed     = NO;
    _loadedEmitted       = NO;
    _awaitingFirstRender = NO;
    _reportedUnusable    = NO;
    _latitude          = 0;
    _longitude         = 0;
    _heading           = 0;
    _hasPosition       = NO;
    _readyTimeoutMs    = kDefaultReadyTimeoutMs;
    _positionTimeoutMs = kDefaultPositionTimeoutMs;
    _requestedAt       = nil;
    _readyToken++;      // invalidate anything still scheduled
    _positionToken++;
    _renderToken++;
}

#pragma mark - Panorama lifecycle

/**
 * Created lazily on the first position rather than in init: the SDK is only
 * spun up when a ride actually needs it, and a recycled view that is never used
 * again costs nothing.
 */
- (BOOL)ensurePanorama
{
    if (_panoView != nil) {
        return YES;
    }

    if (!gServicesUsable) {
        if (!_reportedUnusable) {
            _reportedUnusable = YES;
            [self emitLog:@"maps sdk unusable" detail:@{
                @"apiKey": gApiKeyState,
                @"provideAPIKey": gProvideResult,
                @"note": @"panorama not created; a GMSPanoramaView without a key raises",
            }];
            [self emitError:@"unknown"];
        }
        return NO;
    }

    _panoView = [[GMSPanoramaView alloc] initWithFrame:self.bounds];
    _panoView.delegate = self;

    // Revealed only once tiles have painted — see "Hidden until painted".
    _panoView.hidden = YES;

    // The rider must not be able to walk the panorama off the route.
    // Matches Android's isStreetNamesEnabled/isZoomGestures/isPanningGestures/
    // isUserNavigationEnabled all being false.
    [_panoView setAllGesturesEnabled:NO];
    _panoView.streetNamesHidden = YES;

    [self addSubview:_panoView];

    [self emitLog:@"panorama created" detail:@{
        @"width": @(self.bounds.size.width),
        @"height": @(self.bounds.size.height),
    }];

    [self armReadyTimeout];
    return YES;
}

- (void)teardownPanorama
{
    _readyToken++;
    _positionToken++;
    _renderToken++;

    if (_panoView) {
        _panoView.delegate = nil;
        [_panoView removeFromSuperview];
        _panoView = nil;
    }
}

#pragma mark - Timeouts

- (void)armReadyTimeout
{
    const int64_t token = ++_readyToken;
    const double ms = _readyTimeoutMs;

    __weak __typeof(self) weakSelf = self;
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(ms * NSEC_PER_MSEC)),
                   dispatch_get_main_queue(), ^{
        __typeof(self) strongSelf = weakSelf;
        if (!strongSelf || strongSelf->_readyToken != token) {
            return;  // cancelled, superseded, or the view is gone
        }
        [strongSelf emitLog:@"ready timeout expired" detail:@{@"timeout": @(ms)}];
        [strongSelf emitError:@"unknown"];
    });
}

- (void)armPositionTimeout
{
    const int64_t token = ++_positionToken;
    const double ms = _positionTimeoutMs;

    __weak __typeof(self) weakSelf = self;
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(ms * NSEC_PER_MSEC)),
                   dispatch_get_main_queue(), ^{
        __typeof(self) strongSelf = weakSelf;
        if (!strongSelf || strongSelf->_positionToken != token) {
            return;
        }
        [strongSelf emitLog:@"position timeout expired" detail:@{
            @"timeout": @(ms),
            @"loaded": @(strongSelf->_licenseConsumed),
            @"width": @(strongSelf.bounds.size.width),
            @"height": @(strongSelf.bounds.size.height),
        }];
        [strongSelf emitError:@"unavailable"];
    });
}

/** Any delegate response means the SDK is alive; the ready timeout has done its job. */
- (void)cancelTimeouts
{
    _readyToken++;
    _positionToken++;
}

#pragma mark - Props

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
    const auto &next = *std::static_pointer_cast<StreetViewProps const>(props);

    // 0 means "not supplied" — see kDefaultReadyTimeoutMs.
    _readyTimeoutMs    = next.readyTimeout    > 0 ? next.readyTimeout    : kDefaultReadyTimeoutMs;
    _positionTimeoutMs = next.positionTimeout > 0 ? next.positionTimeout : kDefaultPositionTimeoutMs;

    const BOOL positionChanged =
        !_hasPosition || next.latitude != _latitude || next.longitude != _longitude;
    const BOOL headingChanged = !_hasPosition || next.heading != _heading;

    _latitude    = next.latitude;
    _longitude   = next.longitude;
    _heading     = next.heading;
    _hasPosition = YES;

    if ([self ensurePanorama]) {
        if (positionChanged) {
            [self applyPosition];
        }
        if (headingChanged) {
            [self applyHeading];
        }
    }

    [super updateProps:props oldProps:oldProps];
}

- (void)applyPosition
{
    _requestedAt = [NSDate date];

    [self emitLog:@"moveNearCoordinate" detail:@{
        @"lat": @(_latitude),
        @"lng": @(_longitude),
        @"radius": @(kPanoramaSearchRadius),
        @"positionTimeout": @(_positionTimeoutMs),
    }];

    [self armPositionTimeout];

    [_panoView moveNearCoordinate:CLLocationCoordinate2DMake(_latitude, _longitude)
                           radius:kPanoramaSearchRadius];
}

- (void)applyHeading
{
    // Assigned rather than animated: Android uses animateTo(camera, 0), i.e. a
    // zero-duration animation, which is the same thing.
    _panoView.camera = [GMSPanoramaCamera cameraWithHeading:_heading pitch:0 zoom:1];
}

#pragma mark - GMSPanoramaViewDelegate

/**
 * The primary signal. `panorama` is nil when there is no imagery at the
 * requested position — which is an answer, not a failure.
 */
- (void)panoramaView:(GMSPanoramaView *)view didMoveToPanorama:(GMSPanorama *)panorama
{
    [self cancelTimeouts];

    const BOOL hasImagery = (panorama != nil);
    const double elapsed = _requestedAt ? [[NSDate date] timeIntervalSinceDate:_requestedAt] * 1000 : -1;

    if (!_licenseConsumed) {
        _licenseConsumed = YES;

        [self emitLog:@"first panorama change" detail:@{
            @"hasImagery": @(hasImagery),
            @"panoramaId": (hasImagery && panorama.panoramaID) ? panorama.panoramaID : @"",
            @"elapsed": @(elapsed),
            @"width": @(self.bounds.size.width),
            @"height": @(self.bounds.size.height),
        }];

        [self emitLicenseConsumed];

        if (!hasImagery) {
            // Nothing will ever paint, so there is nothing to wait for. Sending
            // onLoaded here is what lets the start overlay lift and the service
            // fall back, rather than sitting on a black screen until a timeout.
            [self emitLoadedOnce:@"no-imagery"];
            [self emitNoPanorama];
            return;
        }

        _awaitingFirstRender = YES;
        [self armFirstRenderTimeout];
        return;
    }

    if (hasImagery) {
        [self emitPanoramaChanged];
    } else {
        [self emitNoPanorama];
    }
}

/**
 * Redundant with didMoveToPanorama: for the contract, but its `panorama` is
 * annotated nonnull while the other is nullable — so it is exactly the shape of
 * argument c41b24c proved cannot be trusted. Logged, never dereferenced blindly.
 */
- (void)panoramaView:(GMSPanoramaView *)view
   didMoveToPanorama:(GMSPanorama *)panorama
      nearCoordinate:(CLLocationCoordinate2D)coordinate
{
    [self emitLog:@"didMoveToPanorama:nearCoordinate" detail:@{
        @"panoramaWasNil": @(panorama == nil),
        @"lat": @(coordinate.latitude),
        @"lng": @(coordinate.longitude),
    }];
}

/**
 * A genuine failure for a moveNearCoordinate: — network, quota, or a rejected
 * API key.
 *
 * Open question (design §4): whether the iOS SDK also reports plain "no imagery
 * here" through this path rather than a nil panorama. Android does not: null is
 * its no-imagery signal. Everything needed to settle that is logged, and M3
 * decides against the evidence rather than a guess.
 */
- (void)panoramaView:(GMSPanoramaView *)view
               error:(NSError *)error
onMoveNearCoordinate:(CLLocationCoordinate2D)coordinate
{
    [self cancelTimeouts];

    [self emitLog:@"error onMoveNearCoordinate" detail:@{
        @"errorWasNil": @(error == nil),
        @"domain": error.domain ?: @"",
        @"code": @(error.code),
        @"description": error.localizedDescription ?: @"",
        @"lat": @(coordinate.latitude),
        @"lng": @(coordinate.longitude),
        @"loaded": @(_licenseConsumed),
    }];

    // Deliberately not emitting onLoaded/onLicenseConsumed here. Android's error
    // path is a timeout, which emits neither, and StreetView.tsx's retry ladder
    // depends on onLoaded meaning "a panorama settled".
    [self emitError:@"unavailable"];
}

/** No contract event — Android has no equivalent. Diagnostics only. */
- (void)panoramaViewDidStartRendering:(GMSPanoramaView *)panoramaView
{
    [self emitLog:@"didStartRendering" detail:@{}];
}

/**
 * Fires when tiles have loaded *or permanently failed to load*. Android has
 * nothing like it, and it is the one signal that can distinguish "the SDK found
 * a panorama but never painted it" from "the SDK never found anything" — the
 * exact ambiguity behind the Android black-screen reports.
 */
- (void)panoramaViewDidFinishRendering:(GMSPanoramaView *)panoramaView
{
    [self emitLog:@"didFinishRendering" detail:@{
        @"awaitingFirstRender": @(_awaitingFirstRender),
        @"elapsed": @(_requestedAt ? [[NSDate date] timeIntervalSinceDate:_requestedAt] * 1000 : -1),
    }];

    if (_awaitingFirstRender) {
        _awaitingFirstRender = NO;
        _renderToken++;                     // cancel the safety timeout
        [self emitLoadedOnce:@"rendered"];
    }
}

/**
 * Guarantees onLoaded is sent even if didFinishRendering never arrives. Without
 * it, a panorama that resolves but never reports painting would leave the start
 * overlay up for the whole ride.
 */
- (void)armFirstRenderTimeout
{
    const int64_t token = ++_renderToken;

    __weak __typeof(self) weakSelf = self;
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(kFirstRenderTimeoutMs * NSEC_PER_MSEC)),
                   dispatch_get_main_queue(), ^{
        __typeof(self) strongSelf = weakSelf;
        if (!strongSelf || strongSelf->_renderToken != token || !strongSelf->_awaitingFirstRender) {
            return;
        }
        strongSelf->_awaitingFirstRender = NO;
        [strongSelf emitLog:@"first render timeout expired" detail:@{
            @"timeout": @(kFirstRenderTimeoutMs),
            @"note": @"tiles never reported painting; releasing the overlay and revealing anyway",
        }];
        [strongSelf emitLoadedOnce:@"render-timeout"];
    });
}

#pragma mark - Event emission

- (void)emitLicenseConsumed
{
    if (!_eventEmitter) return;
    @try {
        [self emitter].onLicenseConsumed({});
    } @catch (NSException *e) {
        NSLog(@"[StreetView] onLicenseConsumed threw: %@", e.reason);
    }
}

/**
 * `reason` records which of the three paths released the overlay — rendered,
 * no-imagery, or render-timeout. Without it a slow first load and a broken
 * didFinishRendering look identical in the event log.
 */
- (void)emitLoadedOnce:(NSString *)reason
{
    if (_loadedEmitted) return;
    _loadedEmitted = YES;

    // Ready to serve and visible are the same moment — see "Hidden until ready
    // to serve". Covers all three reasons without any of them special-casing it.
    _panoView.hidden = NO;

    [self emitLog:@"loaded" detail:@{
        @"reason": reason,
        @"elapsed": @(_requestedAt ? [[NSDate date] timeIntervalSinceDate:_requestedAt] * 1000 : -1),
    }];

    if (!_eventEmitter) return;
    @try {
        [self emitter].onLoaded({});
    } @catch (NSException *e) {
        NSLog(@"[StreetView] onLoaded threw: %@", e.reason);
    }
}

- (void)emitNoPanorama
{
    if (!_eventEmitter) return;
    @try {
        [self emitter].onNoPanorama({});
    } @catch (NSException *e) {
        NSLog(@"[StreetView] onNoPanorama threw: %@", e.reason);
    }
}

- (void)emitPanoramaChanged
{
    if (!_eventEmitter) return;
    @try {
        [self emitter].onPanoramaChanged({});
    } @catch (NSException *e) {
        NSLog(@"[StreetView] onPanoramaChanged threw: %@", e.reason);
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
        NSLog(@"[StreetView] onError threw: %@", e.reason);
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
        [self emitter].onLog(StreetViewEventEmitter::OnLog{
            .message = std::string([payload[@"message"] UTF8String] ?: ""),
            .detail  = std::string([payload[@"detail"]  UTF8String] ?: ""),
        });
    } @catch (NSException *e) {
        // The one NSLog in this file, for the reason given at the top: an event
        // cannot report that the event pipeline is broken.
        NSLog(@"[StreetView] emitting onLog threw: %@", e.reason);
    }
}

- (const StreetViewEventEmitter &)emitter
{
    return static_cast<const StreetViewEventEmitter &>(*_eventEmitter);
}

/**
 * `detail` travels as a JSON string so the Codegen surface stays fixed whatever
 * the native side wants to report. StreetView.tsx parses it and spreads the
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
 * (codegenConfig.ios.componentProvider in package.json) to resolve "StreetView"
 * to this class.
 */
Class<RCTComponentViewProtocol> StreetViewCls(void)
{
    return RCTStreetViewComponentView.class;
}
