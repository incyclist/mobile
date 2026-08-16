package com.incyclist.app;

import androidx.annotation.Nullable;
import com.google.android.gms.maps.StreetViewPanorama;
import com.google.android.gms.maps.model.StreetViewPanoramaLocation;

/**
 * Java implementation of OnStreetViewPanoramaChangeListener.
 *
 * The Maps SDK annotates `location` as @NonNull, but its documented, actual runtime behaviour
 * is to call this listener with location=null when there is no Street View imagery at the
 * requested position - that IS how "no panorama" is reported. A Kotlin lambda or override is
 * forced to match that (incorrect) @NonNull annotation, and Kotlin's compiler then generates
 * a null-check that crashes the app the moment the SDK does exactly what its own contract
 * says it will.
 *
 * Implementing the interface in Java sidesteps Kotlin's null-check codegen entirely - only the
 * Kotlin compiler inserts those checks, and only for parameters it declares non-null itself.
 * Callback.onChange is declared @Nullable, so Kotlin treats it correctly on the calling side.
 */
public class NullSafeStreetViewPanoramaChangeListener
        implements StreetViewPanorama.OnStreetViewPanoramaChangeListener {

    public interface Callback {
        void onChange(@Nullable StreetViewPanoramaLocation location);
    }

    private final Callback callback;

    public NullSafeStreetViewPanoramaChangeListener(Callback callback) {
        this.callback = callback;
    }

    @Override
    public void onStreetViewPanoramaChange(StreetViewPanoramaLocation location) {
        callback.onChange(location);
    }
}
