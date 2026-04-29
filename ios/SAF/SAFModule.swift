import Foundation

@objc(SAFModule)
class SAFModule: NSObject {

    @objc static func requiresMainQueueSetup() -> Bool {
        return false
    }

    /// Not implemented on iOS — file:// URIs are handled by RNFS directly.
    @objc func listFiles(_ uri: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        reject("ERR_NOT_IMPLEMENTED", "SAF.listFiles is not implemented on iOS — use RNFS for file:// URIs", nil)
    }

    /// Not implemented on iOS — file:// URIs are handled by RNFS directly.
    @objc func readFile(_ uri: String, encoding: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        reject("ERR_NOT_IMPLEMENTED", "SAF.readFile is not implemented on iOS — use RNFS for file:// URIs", nil)
    }

    /// Not implemented on iOS — file:// URIs are handled by RNFS directly.
    @objc func exists(_ uri: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        reject("ERR_NOT_IMPLEMENTED", "SAF.exists is not implemented on iOS — use RNFS for file:// URIs", nil)
    }
}
