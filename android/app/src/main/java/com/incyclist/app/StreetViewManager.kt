package com.incyclist.app

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.viewmanagers.StreetViewManagerDelegate
import com.facebook.react.viewmanagers.StreetViewManagerInterface
import com.google.android.gms.maps.MapsInitializer
import com.google.android.gms.maps.StreetViewPanorama
import com.google.android.gms.maps.StreetViewPanoramaView
import com.google.android.gms.maps.model.LatLng
import com.google.android.gms.maps.model.StreetViewPanoramaCamera
import java.util.WeakHashMap

/**
 * StreetView — Fabric Native View Component (Android)
 *
 * Wraps Google's StreetViewPanoramaView from the Maps SDK for Android.
 *
 * Verification scope only — this is a minimum implementation that exists to
 * verify that:
 *   - the Fabric view component is registered correctly,
 *   - the Storybook mock alias picks up the spec import,
 *   - latitude / longitude / heading prop changes from JS reach the
 *     panorama and visibly update the rendered view.
 *
 * Key design notes:
 *
 *   1. StreetViewPanoramaView requires Activity-style lifecycle methods to
 *      be forwarded (onCreate, onResume, onPause, onDestroy). Without these,
 *      the panorama never finishes initialising. We call onCreate(null) +
 *      onResume() in createViewInstance, and onPause() + onDestroy() in
 *      onDropViewInstance. Foreground/background of the host Activity is
 *      NOT forwarded — known limitation for this verification build.
 *
 *   2. Panorama acquisition via getStreetViewPanoramaAsync is asynchronous.
 *      Props arriving before the callback fires are cached in a per-view
 *      PanoramaState object and applied once the StreetViewPanorama reference
 *      becomes available.
 *
 *   3. State per view is held in a WeakHashMap keyed by the view itself.
 *      When the view is dropped, its entry is removed in onDropViewInstance.
 *
 *   4. Google Maps SDK reads the API key from AndroidManifest meta-data
 *      (com.google.android.geo.API_KEY) at SDK initialisation. There is no
 *      runtime injection path — the key MUST be present at build time. See
 *      AndroidManifest changes in this bundle.
 *
 *   5. MapsInitializer.initialize(context) is called defensively before the
 *      panorama view is constructed. StreetViewPanoramaView should call this
 *      internally, but this is the first use of the Google Maps Android SDK
 *      in this app (the app uses Apple Maps on iOS via react-native-maps and
 *      MapLibre on Android — Google Maps has never been initialised here
 *      before). The defensive call ensures the SDK is ready regardless of
 *      ordering.
 *
 *   6. Multiple StreetViewPanoramaView instances in one Activity are not
 *      supported by the Maps SDK (official limitation). The demo page
 *      renders exactly one — do not nest or duplicate.
 */
@ReactModule(name = StreetViewManager.NAME)
class StreetViewManager(
    private val reactContext: ReactApplicationContext,
) : SimpleViewManager<StreetViewPanoramaView>(),
    StreetViewManagerInterface<StreetViewPanoramaView> {

    private val states = WeakHashMap<StreetViewPanoramaView, PanoramaState>()

    private val delegate: ViewManagerDelegate<StreetViewPanoramaView> =
        StreetViewManagerDelegate(this)

    override fun getDelegate(): ViewManagerDelegate<StreetViewPanoramaView> = delegate

    override fun getName(): String = NAME

    override fun createViewInstance(context: ThemedReactContext): StreetViewPanoramaView {
        android.util.Log.d(TAG, "createViewInstance")

        // Defensive: ensure the Google Maps SDK is initialised before the
        // panorama view tries to use it. This app does not use Google Maps
        // anywhere else, so this is the SDK's first-use point. Idempotent —
        // safe to call repeatedly.
        try {
            MapsInitializer.initialize(context.applicationContext)
        } catch (t: Throwable) {
            android.util.Log.w(TAG, "MapsInitializer.initialize threw: ${t.message}")
            // Continue anyway — StreetViewPanoramaView will surface its own
            // error via logcat if init genuinely failed (typically: API key
            // missing or invalid).
        }

        val view = StreetViewPanoramaView(context)
        // Lifecycle forwarding — required for the panorama to render.
        view.onCreate(null)
        view.onResume()

        val state = PanoramaState()
        states[view] = state

        view.getStreetViewPanoramaAsync { panorama ->
            android.util.Log.d(TAG, "onStreetViewPanoramaReady")
            state.panorama = panorama
            state.applyIfReady()
        }

        return view
    }

    override fun onDropViewInstance(view: StreetViewPanoramaView) {
        android.util.Log.d(TAG, "onDropViewInstance")
        try {
            view.onPause()
            view.onDestroy()
        } catch (t: Throwable) {
            android.util.Log.w(TAG, "lifecycle teardown threw: ${t.message}")
        }
        states.remove(view)
        super.onDropViewInstance(view)
    }

    // ── Props ──────────────────────────────────────────────────────────────
    // Codegen requires both an interface override (typed as Double per the
    // generated StreetViewManagerInterface) and a @ReactProp annotation. The
    // @ReactProp form is what the legacy view-manager path picks up; the
    // override is what the Fabric path uses through the delegate.

    @ReactProp(name = "latitude", defaultDouble = 0.0)
    override fun setLatitude(view: StreetViewPanoramaView, value: Double) {
        val state = states[view] ?: return
        state.pendingLat = value
        state.applyIfReady()
    }

    @ReactProp(name = "longitude", defaultDouble = 0.0)
    override fun setLongitude(view: StreetViewPanoramaView, value: Double) {
        val state = states[view] ?: return
        state.pendingLng = value
        state.applyIfReady()
    }

    @ReactProp(name = "heading", defaultDouble = 0.0)
    override fun setHeading(view: StreetViewPanoramaView, value: Double) {
        val state = states[view] ?: return
        state.pendingHeading = value
        state.applyIfReady()
    }

    // ── Per-view state ─────────────────────────────────────────────────────

    private class PanoramaState {
        var panorama: StreetViewPanorama? = null
        var pendingLat: Double? = null
        var pendingLng: Double? = null
        var pendingHeading: Double? = null
        var positionApplied: Boolean = false

        /**
         * Apply whatever pending values we have to the panorama, if it's
         * ready. Called both from prop setters (panorama may or may not be
         * ready) and from the onStreetViewPanoramaReady callback (panorama
         * just became ready).
         *
         * Position is set only when BOTH lat and lng are present. Heading is
         * applied independently — bearing rotation is cheap and visible
         * even if position hasn't changed.
         */
        fun applyIfReady() {
            val p = panorama ?: return

            val lat = pendingLat
            val lng = pendingLng
            if (lat != null && lng != null) {
                // setPosition is idempotent on the same coordinate, so we
                // do not de-duplicate. A radius of 50m is permissive enough
                // for cycling routes where panoramas are sparse.
                p.setPosition(LatLng(lat, lng), 50)
                positionApplied = true
            }

            val heading = pendingHeading
            if (heading != null) {
                val current = p.panoramaCamera
                val newCamera = StreetViewPanoramaCamera.Builder(current)
                    .bearing(heading.toFloat())
                    .build()
                // 300ms animation for visible heading change. For
                // verification-only, a smooth animation makes it obvious
                // that updates are arriving. Production may want zero
                // duration to follow ride position tightly.
                p.animateTo(newCamera, 300L)
            }
        }
    }

    companion object {
        const val NAME = "StreetView"
        private const val TAG = "StreetViewManager"
    }
}
