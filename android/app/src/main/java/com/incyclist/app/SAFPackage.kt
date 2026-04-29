package com.incyclist.app

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class SAFPackage : BaseReactPackage() {

    override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
        return if (name == SAFModule.NAME) {
            SAFModule(reactContext)
        } else {
            null
        }
    }

    override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
        return ReactModuleInfoProvider {
            mapOf(
                SAFModule.NAME to ReactModuleInfo(
                    SAFModule.NAME,
                    SAFModule.NAME,
                    false,  // canOverrideExistingModule
                    false,  // needsEagerInit
                    false,  // isCxxModule
                    true    // isTurboModule
                )
            )
        }
    }
}
