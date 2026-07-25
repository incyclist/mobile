export interface WorkoutGestureHintLegendItem {
    symbol: string   // e.g. '◀ ▶' or '▲ ▼'
    label: string    // terse form, used in compact layout — e.g. 'Step back / forward' or 'Load ±1%'
    /**
     * Fuller sentence used in normal (tablet) layout, where there's room to actually spell out
     * what the gesture is and does — e.g. 'Swipe left or right to step back or forward through
     * the workout'. Falls back to `label` when omitted, so existing (terse-only) callers keep
     * working unchanged.
     */
    description?: string
}

export interface WorkoutGestureHintOverlayProps {
    /**
     * Primary message (e.g. "Start pedalling to start the workout"). Passed in rather than
     * hardcoded so a future ride type (GPX/Video) can reuse this component with its own copy
     * (workout-mobile-hld.md §3.2 "design for reuse").
     */
    message: string
    /**
     * Short line making explicit that the legend below is about swipe gestures — e.g. "Swipe the
     * screen to control your workout:". Without it, nothing on the overlay actually says the word
     * "swipe". Optional with a sensible default so existing callers don't need to change.
     */
    legendIntro?: string
    /** Gesture legend rows (step back/forward, load up/down) — content, not hardcoded. */
    legend: WorkoutGestureHintLegendItem[]
    /**
     * Computed once by the page (via the shared `useScreenLayout()` hook) and passed down as a
     * plain boolean — mirrors `WorkoutStepsList`'s existing `compact` prop convention, rather
     * than every leaf ride-screen component re-reading the hook itself.
     */
    compact: boolean
    dontShowAgainLabel?: string   // default "Don't show this again"
    closeLabel?: string           // default "Got it"
    /**
     * Always hides the overlay for the rest of this ride. Only persists the "never show again"
     * flag when dontShowAgain is true — the decision itself is owned by WorkoutRidePageService,
     * this component just reports the user's choice.
     */
    onDismiss: (props: { dontShowAgain: boolean }) => void
}
