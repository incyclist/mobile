#import <React/RCTViewComponentView.h>
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * RCTStreetViewComponentView — Fabric native view component (iOS)
 *
 * iOS counterpart of Android's StreetViewManager. See
 * android/app/src/main/java/com/incyclist/app/StreetViewManager.kt for the
 * event contract this must reproduce, and internal/designs/ios-streetview-design.md
 * for the reasoning.
 *
 * The interface is deliberately empty: everything is driven by props and
 * delegate callbacks, and nothing outside the renderer talks to this class.
 *
 * Registered via codegenConfig.ios.componentProvider in package.json, mapping
 * the JS component name "StreetView" to this class. The RCT<Name>ComponentView
 * naming convention is also satisfied, so the convention-based lookup resolves
 * to the same class if the explicit map is ever ignored.
 */
@interface RCTStreetViewComponentView : RCTViewComponentView
@end

NS_ASSUME_NONNULL_END
