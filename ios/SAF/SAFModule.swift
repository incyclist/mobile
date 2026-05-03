@objc(SAF)
class SAFModule: NSObject {

    @objc static func requiresMainQueueSetup() -> Bool { return false }

    @objc func listFiles(_ uri: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        resolve([])
    }

    @objc func readFile(_ uri: String, encoding: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        resolve("")
    }

    @objc func exists(_ uri: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        resolve(false)
    }
}