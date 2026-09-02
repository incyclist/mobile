package com.incyclist.app

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

/**
 * SatelliteViewPackage — registers SatelliteViewManager as a view manager.
 *
 * Follows StreetViewPackage exactly: a plain ReactPackage, not BaseReactPackage /
 * TurboReactPackage. Fabric view components are registered via createViewManagers, which both
 * the legacy and the new architecture pipelines understand — a Fabric view component is NOT a
 * TurboModule and does not need the ReactModuleInfoProvider mechanism BaseReactPackage
 * requires.
 *
 * NOTE: this creates a NEW SatelliteViewManager per call to createViewManagers. React Native
 * calls this once per ReactPackage instance per host, and the project registers packages twice
 * (legacy host and new arch host in MainApplication.kt) — so there are two manager instances,
 * each owning its own WeakHashMap of per-view state. That is fine: the two hosts serve
 * different activity lifecycles and never share view instances.
 */
class SatelliteViewPackage : ReactPackage {
    override fun createViewManagers(
        reactContext: ReactApplicationContext,
    ): List<ViewManager<*, *>> = listOf(SatelliteViewManager(reactContext))

    override fun createNativeModules(
        reactContext: ReactApplicationContext,
    ): List<NativeModule> = emptyList()
}
