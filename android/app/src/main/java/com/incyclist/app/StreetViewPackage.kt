package com.incyclist.app

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

/**
 * StreetViewPackage — registers StreetViewManager as a view manager.
 *
 * This Package follows the ExitPackage shape (ReactPackage), not the
 * FolderAccessPackage shape (BaseReactPackage / TurboReactPackage).
 *
 * Reason: Fabric view components are registered via createViewManagers,
 * which both the legacy and new architecture pipelines understand. A
 * Fabric view component is NOT a TurboModule and does not need the
 * ReactModuleInfoProvider mechanism that BaseReactPackage requires.
 *
 * NOTE: this implementation creates a NEW StreetViewManager per call to
 * createViewManagers. React Native calls this once per ReactPackage
 * instance per host, so we get one StreetViewManager per host. The
 * project already registers packages twice (once in the legacy host and
 * once in the new arch host in MainApplication.kt) — that gives us two
 * StreetViewManager instances total. Each owns its own WeakHashMap of
 * per-view state. This is fine because the two hosts serve different
 * activity lifecycles and never share view instances.
 */
class StreetViewPackage : ReactPackage {
    override fun createViewManagers(
        reactContext: ReactApplicationContext,
    ): List<ViewManager<*, *>> = listOf(StreetViewManager(reactContext))

    override fun createNativeModules(
        reactContext: ReactApplicationContext,
    ): List<NativeModule> = emptyList()
}
