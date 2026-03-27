import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?
    var reactNativeDelegate: ReactNativeDelegate?
    var reactNativeFactory: RCTReactNativeFactory?

    func application(_ application: UIApplication, supportedInterfaceOrientationsFor window: UIWindow?) -> UIInterfaceOrientationMask {
        return Orientation.getOrientation()
    }

    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        let delegate = ReactNativeDelegate()
        let factory = RCTReactNativeFactory(delegate: delegate)
        delegate.dependencyProvider = RCTAppDependencyProvider()

        reactNativeDelegate = delegate
        reactNativeFactory = factory

        window = UIWindow(frame: UIScreen.main.bounds)

        factory.startReactNative(
            withModuleName: "incyclist",
            in: window,
            launchOptions: launchOptions
        )

        return true
    }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
    // 0.83.1 uses bundleURL() as the primary source for the factory
    override func bundleURL() -> URL? {
        let defaults = UserDefaults.standard
        
        // 1. Check for the dynamic bundle path in UserDefaults
        if let bundlePath = defaults.string(forKey: "active_bundle_path") {
            let bundleURL = URL(fileURLWithPath: bundlePath).appendingPathComponent("main.jsbundle")
            
            if FileManager.default.fileExists(atPath: bundleURL.path) {
                return bundleURL
            }
        }

        // 2. Fallback to default behavior (Metro in Debug, main.jsbundle in Release)
        #if DEBUG
          return RCTBundleURLProvider.shared().jsBundleURL(forBundleRoot: "index")
        #else
          return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
        #endif
      
    }

    // Explicitly point sourceURL to our bundleURL logic for backward compatibility
    override func sourceURL(for bridge: RCTBridge) -> URL? {
        return self.bundleURL()
    }
}
