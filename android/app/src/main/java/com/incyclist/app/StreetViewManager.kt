package com.incyclist.app

import android.os.Handler
import android.os.Looper
import android.view.View
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.Event
import com.facebook.react.uimanager.events.EventDispatcher
import com.facebook.react.viewmanagers.StreetViewManagerDelegate
import com.facebook.react.viewmanagers.StreetViewManagerInterface
import com.google.android.gms.maps.MapsInitializer
import com.google.android.gms.maps.StreetViewPanorama
import com.google.android.gms.maps.StreetViewPanoramaView
import com.google.android.gms.maps.model.LatLng
import com.google.android.gms.maps.model.StreetViewPanoramaCamera
import java.util.WeakHashMap

/**
 * StreetViewManager — Fabric Native View Component (Android)
 *
 * Wraps Google's StreetViewPanoramaView from the Maps SDK for Android.
 *
 * ── Event contract ────────────────────────────────────────────────────────
 *
 * onLicenseConsumed   Fires once per component lifetime on the first
 *                     OnStreetViewPanoramaChangeListener callback. This is
 *                     the moment Google charges a Dynamic Street View SKU
 *                     event. Never fires again after the first time.
 *
 * onLoaded            Fires once per component lifetime immediately after
 *                     onLicenseConsumed. Signals that the component has
 *                     settled on its first rendered state (panorama visible
 *                     or black screen if no imagery). Start overlay dismissal
 *                     should wait for this event.
 *
 * onNoPanorama        Fires when OnStreetViewPanoramaChangeListener returns
 *                     a null location — no Street View imagery at the
 *                     requested position. Fires on initial load AND on
 *                     subsequent position updates. The service layer decides
 *                     UX (popup, pill, fallback to MapView). When onNoPanorama
 *                     fires, the previous image remains visible; if this is
 *                     the initial position, a black screen is shown.
 *
 * onPanoramaChanged   Fires when OnStreetViewPanoramaChangeListener returns
 *                     a non-null location for a position update AFTER the
 *                     initial onLoaded has fired. Used by the service to
 *                     measure update round-trip time and throttle update rate.
 *                     Does NOT fire on the initial load.
 *
 * onError             Fires when a timeout expires:
 *                     - reason='unknown':     getStreetViewPanoramaAsync did
 *                       not fire within readyTimeout ms. Likely: Google Play
 *                       Services not installed or SDK init failure.
 *                     - reason='unavailable': OnStreetViewPanoramaChangeListener
 *                       did not fire within positionTimeout ms after setPosition.
 *                       Likely: invalid API key or network failure.
 *                     Fires throughout the component lifetime — the service
 *                     layer decides whether to act on single vs recurring errors.
 *
 * ── Timeout props ────────────────────────────────────────────────────────
 *
 * readyTimeout        ms to wait for getStreetViewPanoramaAsync. Default 10000.
 *                     Cancelled when panorama ready callback fires.
 *                     Fires onError('unknown') on expiry.
 *
 * positionTimeout     ms to wait for OnStreetViewPanoramaChangeListener after
 *                     setPosition. Default 2000. Cancelled the moment the
 *                     change listener fires (null or non-null).
 *                     Fires onError('unavailable') on expiry.
 *                     Should be set below the position update interval.
 *
 * ── Teardown / black screen workaround ───────────────────────────────────
 *
 * If StreetViewPanoramaView occupies 100% of the Activity surface,
 * onDestroy() corrupts the window compositor, leaving a black region on the
 * next visible screen. The JS wrapper applies margin:1 by default so the
 * view never owns the full surface. Do not remove this margin.
 *
 * ── Single-instance constraint ───────────────────────────────────────────
 *
 * The Maps SDK for Android does not support multiple StreetViewPanoramaView
 * instances in one Activity. The demo page (and later GPXTourPage) must
 * render exactly one StreetView at a time.
 */
@ReactModule(name = StreetViewManager.NAME)
class StreetViewManager(
    private val reactContext: ReactApplicationContext,
) : SimpleViewManager<StreetViewPanoramaView>(),
    StreetViewManagerInterface<StreetViewPanoramaView> {

    private val states = WeakHashMap<StreetViewPanoramaView, PanoramaState>()
    private val mainHandler = Handler(Looper.getMainLooper())

    private val delegate: ViewManagerDelegate<StreetViewPanoramaView> =
        StreetViewManagerDelegate(this)

    override fun getDelegate(): ViewManagerDelegate<StreetViewPanoramaView> = delegate
    override fun getName(): String = NAME

    override fun createViewInstance(context: ThemedReactContext): StreetViewPanoramaView {
        android.util.Log.d(TAG, "createViewInstance")

        try {
            MapsInitializer.initialize(context.applicationContext)
        } catch (t: Throwable) {
            android.util.Log.w(TAG, "MapsInitializer.initialize threw: ${t.message}")
        }

        val view = StreetViewPanoramaView(context)
        view.visibility = View.INVISIBLE // black-screen workaround companion
        view.onCreate(null)
        view.onResume()

        val state = PanoramaState()
        states[view] = state

        // Arm the ready timeout. Cancelled when getStreetViewPanoramaAsync fires.
        val readyTimeoutRunnable = Runnable {
            android.util.Log.d(TAG, "ready timeout expired")
            emitError(view, "unknown")
        }
        state.readyTimeoutRunnable = readyTimeoutRunnable
        mainHandler.postDelayed(readyTimeoutRunnable, state.readyTimeoutMs)

        view.getStreetViewPanoramaAsync { panorama ->
            android.util.Log.d(TAG, "onStreetViewPanoramaReady")

            // Cancel ready timeout — SDK is functional.
            state.readyTimeoutRunnable?.let { mainHandler.removeCallbacks(it) }
            state.readyTimeoutRunnable = null

            state.panorama = panorama

            panorama.isStreetNamesEnabled = false
            panorama.isZoomGesturesEnabled = false
            panorama.isPanningGesturesEnabled = false            
            panorama.isUserNavigationEnabled = false

            // Listen for panorama location changes. This is the primary signal
            // for all position-related events.
            panorama.setOnStreetViewPanoramaChangeListener { location ->
                handlePanoramaChange(view, state, location)
            }

            view.visibility = View.VISIBLE
            state.applyIfReady()
        }

        return view
    }

    override fun onDropViewInstance(view: StreetViewPanoramaView) {
        android.util.Log.d(TAG, "onDropViewInstance")
        val state = states[view]
        if (state != null) {
            // Cancel any pending timeouts to avoid firing events after teardown.
            state.readyTimeoutRunnable?.let { mainHandler.removeCallbacks(it) }
            state.positionTimeoutRunnable?.let { mainHandler.removeCallbacks(it) }
        }
        try {
            view.visibility = View.INVISIBLE
            view.onPause()
            view.onDestroy()
        } catch (t: Throwable) {
            android.util.Log.w(TAG, "lifecycle teardown threw: ${t.message}")
        }
        states.remove(view)
        super.onDropViewInstance(view)
    }

    // ── Panorama change handler ────────────────────────────────────────────

    private fun handlePanoramaChange(
        view: StreetViewPanoramaView,
        state: PanoramaState,
        location: com.google.android.gms.maps.model.StreetViewPanoramaLocation?,
    ) {
        // Cancel the position timeout — the SDK acknowledged the position
        // request, regardless of whether imagery was found.
        state.positionTimeoutRunnable?.let { mainHandler.removeCallbacks(it) }
        state.positionTimeoutRunnable = null

        val hasImagery = location != null

        if (!state.licenseConsumed) {
            // First change event ever — emit license + loaded, then conditionally
            // noPanorama. onPanoramaChanged does NOT fire on initial load.
            state.licenseConsumed = true
            emitEvent(view, EVENT_LICENSE_CONSUMED, null)
            emitEvent(view, EVENT_LOADED, null)
            if (!hasImagery) {
                emitEvent(view, EVENT_NO_PANORAMA, null)
            }
        } else {
            // Subsequent position updates.
            if (hasImagery) {
                emitEvent(view, EVENT_PANORAMA_CHANGED, null)
            } else {
                emitEvent(view, EVENT_NO_PANORAMA, null)
            }
        }
    }

    // ── Props ─────────────────────────────────────────────────────────────

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

    @ReactProp(name = "readyTimeout", defaultDouble = DEFAULT_READY_TIMEOUT_MS.toDouble())
    override fun setReadyTimeout(view: StreetViewPanoramaView, value: Double) {
        val state = states[view] ?: return
        state.readyTimeoutMs = value.toLong()
        // If the ready timeout runnable is still pending, reschedule it with
        // the new value. This handles the case where the prop arrives before
        // the panorama is ready.
        state.readyTimeoutRunnable?.let {
            mainHandler.removeCallbacks(it)
            mainHandler.postDelayed(it, state.readyTimeoutMs)
        }
    }

    @ReactProp(name = "positionTimeout", defaultDouble = DEFAULT_POSITION_TIMEOUT_MS.toDouble())
    override fun setPositionTimeout(view: StreetViewPanoramaView, value: Double) {
        val state = states[view] ?: return
        state.positionTimeoutMs = value.toLong()
        // No rescheduling needed — positionTimeout is read on the next
        // setPosition call.
    }

    // ── Per-view state ────────────────────────────────────────────────────

    private inner class PanoramaState {
        var panorama: StreetViewPanorama? = null
        var pendingLat: Double? = null
        var pendingLng: Double? = null
        var pendingHeading: Double? = null

        // Timeout configuration — overridable via props.
        var readyTimeoutMs: Long = DEFAULT_READY_TIMEOUT_MS
        var positionTimeoutMs: Long = DEFAULT_POSITION_TIMEOUT_MS

        // Pending timeout runnables. Held so they can be cancelled.
        var readyTimeoutRunnable: Runnable? = null
        var positionTimeoutRunnable: Runnable? = null

        // Whether the first OnStreetViewPanoramaChangeListener has fired.
        // Controls onLicenseConsumed / onLoaded emission (once only) and
        // whether subsequent changes emit onPanoramaChanged vs initial events.
        var licenseConsumed: Boolean = false

        /**
         * Apply pending lat/lng/heading to the panorama if it is ready.
         * Called from prop setters (panorama may not be ready yet) and from
         * the getStreetViewPanoramaAsync callback (panorama just became ready).
         *
         * Position timeout is armed on each setPosition call and cancelled
         * when OnStreetViewPanoramaChangeListener fires.
         */
        fun applyIfReady() {
            val p = panorama ?: return
            val lat = pendingLat ?: return
            val lng = pendingLng ?: return

            // Arm (or re-arm) the position timeout before calling setPosition.
            positionTimeoutRunnable?.let { mainHandler.removeCallbacks(it) }
            val timeoutRunnable = Runnable {
                android.util.Log.d(TAG, "position timeout expired")
                // Find the view associated with this state to emit the event.
                val view = states.entries.firstOrNull { it.value === this }?.key
                    ?: return@Runnable
                emitError(view, "unavailable")
            }
            positionTimeoutRunnable = timeoutRunnable
            mainHandler.postDelayed(timeoutRunnable, positionTimeoutMs)

            p.setPosition(LatLng(lat, lng), 50)

            val heading = pendingHeading
            if (heading != null) {
                val current = p.panoramaCamera
                val newCamera = StreetViewPanoramaCamera.Builder(current)
                    .bearing(heading.toFloat())
                    .build()
                // 300ms animation — smooth enough for verification; production
                // wiring may want 0ms to track position tightly.
                p.animateTo(newCamera, 0)
            }
        }
    }

    // ── Event emission helpers ────────────────────────────────────────────

    private fun emitError(view: StreetViewPanoramaView, reason: String) {
        val payload = Arguments.createMap().apply {
            putString("reason", reason)
        }
        emitEvent(view, EVENT_ERROR, payload)
    }

    private fun emitEvent(
        view: StreetViewPanoramaView,
        eventName: String,
        payload: com.facebook.react.bridge.WritableMap?,
    ) {
        val context = view.context as? ThemedReactContext ?: return
        try {
            val surfaceId = UIManagerHelper.getSurfaceId(context)
            val eventDispatcher = UIManagerHelper.getEventDispatcherForReactTag(context, view.id)
            val finalPayload = payload ?: Arguments.createMap()
            eventDispatcher?.dispatchEvent(
                object : Event<Nothing>(surfaceId, view.id) {
                    override fun getEventName() = eventName
                    override fun getEventData() = finalPayload
                }
            )
        } catch (t: Throwable) {
            android.util.Log.w(TAG, "emitEvent $eventName threw: ${t.message}")
        }
    }


    companion object {
        const val NAME = "StreetView"
        private const val TAG = "StreetViewManager"

        private const val DEFAULT_READY_TIMEOUT_MS = 10_000L
        private const val DEFAULT_POSITION_TIMEOUT_MS = 2_000L

        // Event name constants — must match the prop names in the Codegen spec.
        private const val EVENT_LICENSE_CONSUMED = "onLicenseConsumed"
        private const val EVENT_LOADED           = "onLoaded"
        private const val EVENT_NO_PANORAMA      = "onNoPanorama"
        private const val EVENT_PANORAMA_CHANGED = "onPanoramaChanged"
        private const val EVENT_ERROR            = "onError"
    }
}
