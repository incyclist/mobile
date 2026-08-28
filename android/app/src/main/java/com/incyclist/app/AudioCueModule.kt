package com.incyclist.app

import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioTrack
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule
import kotlin.math.PI
import kotlin.math.min
import kotlin.math.sin

/**
 * AudioCue TurboModule — Android implementation.
 *
 * Synthesizes a short sine tone directly into a PCM buffer and plays it via AudioTrack - no
 * bundled audio files, no res/raw or assets/ entries, nothing read from disk. A new/different tone
 * is just a different (frequencyHz, durationMs) call from JS; nothing here or in the Android
 * project ever needs to change for it.
 *
 * Playback-only — never requests RECORD_AUDIO or touches any microphone API, unlike the prior
 * react-native-audio-api dependency this replaces.
 */
@ReactModule(name = AudioCueModule.NAME)
class AudioCueModule(reactContext: ReactApplicationContext) :
    NativeAudioCueSpec(reactContext) {

    override fun getName(): String = NAME

    private val sampleRate = 44100

    // 5ms gain ramp-down at the end of every tone, to avoid an audible click when the waveform is
    // cut off mid-cycle rather than at a zero crossing.
    private val rampSeconds = 0.005

    override fun play(frequencyHz: Double, durationMs: Double) {
        try {
            val frameCount = ((durationMs / 1000.0) * sampleRate).toInt()
            if (frameCount <= 0) return

            val samples = renderSamples(frequencyHz, frameCount)

            val audioTrack = AudioTrack.Builder()
                .setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_MEDIA)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build()
                )
                .setAudioFormat(
                    AudioFormat.Builder()
                        .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                        .setSampleRate(sampleRate)
                        .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                        .build()
                )
                .setBufferSizeInBytes(samples.size * 2)
                .setTransferMode(AudioTrack.MODE_STATIC)
                .build()

            audioTrack.write(samples, 0, samples.size)

            // Short one-shot tone: release the track once playback reaches the end rather than
            // leaking it - there is no other natural "done" signal for a MODE_STATIC track.
            audioTrack.setNotificationMarkerPosition(frameCount)
            audioTrack.setPlaybackPositionUpdateListener(object : AudioTrack.OnPlaybackPositionUpdateListener {
                override fun onMarkerReached(track: AudioTrack) {
                    track.release()
                }
                override fun onPeriodicNotification(track: AudioTrack) {
                    // Required by the interface, but only onMarkerReached is used - no periodic
                    // notification period is set, so this is never actually called.
                }
            })

            audioTrack.play()
        } catch (e: Exception) {
            // never let a tone-playback failure take down an in-progress ride
        }
    }

    private fun renderSamples(frequencyHz: Double, frameCount: Int): ShortArray {
        val samples = ShortArray(frameCount)
        val rampFrames = min((rampSeconds * sampleRate).toInt(), frameCount / 2)

        for (i in 0 until frameCount) {
            val time = i.toDouble() / sampleRate
            val framesFromEnd = frameCount - i
            val amplitude = if (rampFrames > 0 && framesFromEnd < rampFrames) {
                framesFromEnd.toDouble() / rampFrames
            } else {
                1.0
            }
            samples[i] = (sin(2.0 * PI * frequencyHz * time) * amplitude * Short.MAX_VALUE).toInt().toShort()
        }

        return samples
    }

    companion object {
        const val NAME = "AudioCue"
    }
}
