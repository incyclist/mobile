#import <React/RCTViewComponentView.h>
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * RCTSatelliteViewComponentView — Fabric native view component (iOS)
 *
 * Renders Apple MapKit satellite imagery under a fixed 45 degree camera for the ride
 * screen's 'sat' view, structurally mirroring ios/StreetView/RCTStreetViewComponentView.
 *
 * The interface is deliberately empty: everything is driven by props and MKMapView
 * delegate callbacks, and nothing outside the renderer talks to this class.
 *
 * Registered via codegenConfig.ios.componentProvider in package.json, mapping the
 * JS component name "SatelliteView" to this class. The RCT<Name>ComponentView
 * naming convention is also satisfied, so the convention-based lookup resolves to
 * the same class if the explicit map is ever ignored.
 */
@interface RCTSatelliteViewComponentView : RCTViewComponentView
@end

NS_ASSUME_NONNULL_END
