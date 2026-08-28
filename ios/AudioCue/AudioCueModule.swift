import AVFoundation

/**
 * AudioCue TurboModule — iOS implementation
 *
 * Synthesizes a short sine tone directly into a PCM buffer and plays it via AVAudioEngine /
 * AVAudioPlayerNode - no bundled audio files, no Xcode Resources entries, nothing read from disk.
 * A new/different tone is just a different (frequency, duration) call from JS; nothing here or in
 * the Xcode project ever needs to change for it.
 *
 * Deliberately uses only the AVAudioSession playback surface (.playback category, .mixWithOthers
 * option) and AVAudioEngine's output-side nodes (player -> mixer -> output) — never touches
 * AVAudioSession's record-permission APIs or AVAudioEngine's input node, so no
 * NSMicrophoneUsageDescription entry is required. Replaces a prior dependency on
 * react-native-audio-api, whose native module linked AVAudioApplication/AVAudioSession
 * record-permission symbols regardless of whether the app called them, which App Store review
 * (ITMS-90683) flags on binary presence alone.
 */
@objc(AudioCue)
class AudioCueModule: NSObject {

    // 5ms gain ramp-down at the end of every tone, to avoid an audible click when the waveform is
    // cut off mid-cycle rather than at a zero crossing.
    private static let rampSeconds = 0.005

    private let engine = AVAudioEngine()
    private let playerNode = AVAudioPlayerNode()

    private var sessionConfigured = false
    private var connectedFormat: AVAudioFormat?

    @objc(play:durationMs:)
    func play(_ frequencyHz: NSNumber, durationMs: NSNumber) {
        configureSessionIfNeeded()

        guard let format = startEngineIfNeeded() else {
            return
        }

        let sampleRate = format.sampleRate
        let durationSec = durationMs.doubleValue / 1000.0
        let frameCount = AVAudioFrameCount(max(0, durationSec) * sampleRate)

        guard frameCount > 0,
              let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frameCount) else {
            return
        }
        buffer.frameLength = frameCount

        let frequency = frequencyHz.doubleValue
        let rampFrames = min(AVAudioFrameCount(AudioCueModule.rampSeconds * sampleRate), frameCount / 2)
        let channelData = buffer.floatChannelData![0]

        for frame in 0..<Int(frameCount) {
            let time = Double(frame) / sampleRate
            let framesFromEnd = Int(frameCount) - frame
            let amplitude = (rampFrames > 0 && framesFromEnd < Int(rampFrames))
                ? Double(framesFromEnd) / Double(rampFrames)
                : 1.0
            channelData[frame] = Float(sin(2.0 * Double.pi * frequency * time) * amplitude)
        }

        playerNode.scheduleBuffer(buffer, completionHandler: nil)
        if !playerNode.isPlaying {
            playerNode.play()
        }
    }

    // Configures the session so tones mix with whatever media/music is already playing instead of
    // being silenced by the mute switch. Best-effort - a failure here must never block playback.
    private func configureSessionIfNeeded() {
        guard !sessionConfigured else { return }
        sessionConfigured = true

        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playback, options: [.mixWithOthers])
            try session.setActive(true)
        } catch {
            // ignore - tones still attempt to play without the preferred session configuration
        }
    }

    // Attaches/connects the player node and starts the engine exactly once, using the hardware's
    // actual output sample rate. Returns the mono format every scheduled buffer must be built
    // against - reused on every call rather than recomputed, since AVAudioEngine only allows one
    // active connection format per node pair.
    private func startEngineIfNeeded() -> AVAudioFormat? {
        if let format = connectedFormat {
            if !engine.isRunning {
                try? engine.start()
            }
            return format
        }

        let sampleRate = engine.outputNode.outputFormat(forBus: 0).sampleRate
        guard sampleRate > 0,
              let format = AVAudioFormat(standardFormatWithSampleRate: sampleRate, channels: 1) else {
            return nil
        }

        engine.attach(playerNode)
        engine.connect(playerNode, to: engine.mainMixerNode, format: format)

        do {
            try engine.start()
        } catch {
            return nil
        }

        connectedFormat = format
        return format
    }

    @objc static func requiresMainQueueSetup() -> Bool {
        return false
    }
}
