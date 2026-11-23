import Foundation

/**
 * NativeCapabilities - iOS implementation
 *
 * Tells the JS layer which capabilities THIS native binary carries. JS arrives by hot update on
 * arbitrarily old binaries, so it asks instead of guessing from a version number; a binary
 * without this module reports nothing and the feature stays off.
 *
 * - 'local-link': the control connection and discovery can work, i.e. Info.plist declares the
 *   Bonjour service `_incyclist._tcp` in NSBonjourServices (without it iOS silently blocks
 *   browsing). Read from the real Info.plist, so it cannot drift from the binary.
 */
@objc(NativeCapabilities)
class NativeCapabilitiesModule: NSObject {

    private static let linkBonjourService = "_incyclist._tcp"

    @objc static func requiresMainQueueSetup() -> Bool {
        return false
    }

    static func computeCapabilities() -> [String] {
        var capabilities: [String] = []
        let services = Bundle.main.infoDictionary?["NSBonjourServices"] as? [String] ?? []
        if services.contains(linkBonjourService) {
            capabilities.append("local-link")
        }
        return capabilities
    }

    @objc func constantsToExport() -> [AnyHashable: Any]! {
        return ["capabilities": NativeCapabilitiesModule.computeCapabilities()]
    }
}
