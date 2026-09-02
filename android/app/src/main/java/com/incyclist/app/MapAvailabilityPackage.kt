package com.incyclist.app

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

/**
 * MapAvailabilityPackage — registers MapAvailabilityModule.
 *
 * Its own package rather than a passenger on StreetViewPackage/SatelliteViewPackage: the module
 * answers for both of them, so belonging to either one would be arbitrary.
 *
 * A plain ReactPackage, matching ExitPackage/StreetViewPackage. Legacy modules registered this
 * way are still exposed to the new architecture (ReactPackageTurboModuleManagerDelegate wraps
 * them), so JS reaches this as NativeModules.MapAvailability under bridgeless too.
 */
class MapAvailabilityPackage : ReactPackage {
    override fun createNativeModules(
        reactContext: ReactApplicationContext,
    ): List<NativeModule> = listOf(MapAvailabilityModule(reactContext))

    override fun createViewManagers(
        reactContext: ReactApplicationContext,
    ): List<ViewManager<*, *>> = emptyList()
}
