import { AppState, Dimensions, Platform } from 'react-native'

/**
 * Diagnostics for the system file/directory pickers.
 *
 * On iOS the picker occasionally rejects with `RCTPresentedViewController was nil`
 * (NULL_PRESENTER) and then keeps failing, sometimes even after an app restart. The cause is not
 * known yet, so every failure is logged together with the context needed to tell the candidate
 * explanations apart (process history, app state, screen geometry). Nothing here changes how the
 * pickers behave.
 *
 * All logged fields are strings, numbers or booleans of a fixed type per field, so they map
 * cleanly in Elasticsearch.
 */

export type PickerKind = 'file' | 'directory'

type PickerOutcome = 'none' | 'presented' | 'failed'

interface PickerHistory {
    presented: number
    failed: number
    consecutiveFailures: number
    lastOutcome: PickerOutcome
    firstFailureAt?: number
}

const CANCEL_CODES = new Set(['DOCUMENT_PICKER_CANCELED', 'OPERATION_CANCELED'])

const newHistory = (): PickerHistory => ({
    presented: 0,
    failed: 0,
    consecutiveFailures: 0,
    lastOutcome: 'none',
})

// per JS process: a restarted app starts with an empty history
let history: PickerHistory = newHistory()

type LogFn = (event: Record<string, unknown>) => void

/** True if the user dismissed the picker (the picker was shown, so this is not a failure) */
export const isPickerCancel = (err: any): boolean => CANCEL_CODES.has(err?.code)

const round = (value: number): number => Math.round(value)

const getDiagnostics = (kind: PickerKind) => {
    const screen = Dimensions.get('screen')
    const window = Dimensions.get('window')

    return {
        pickerKind: kind,
        appState: AppState.currentState,
        screenWidth: round(screen.width),
        screenHeight: round(screen.height),
        windowWidth: round(window.width),
        windowHeight: round(window.height),
        osVersion: String(Platform.Version),
        isPad: Platform.OS === 'ios' && Platform.isPad === true,
        pickerPresented: history.presented,
        pickerFailed: history.failed,
        consecutiveFailures: history.consecutiveFailures,
        lastPickerOutcome: history.lastOutcome,
    }
}

/**
 * Records that the picker could be shown to the user (it returned a result or the user cancelled).
 * If earlier calls in this process had failed, logs how long the failure condition lasted.
 */
export const onPickerPresented = (kind: PickerKind, log: LogFn): void => {
    if (history.lastOutcome === 'failed') {
        const sinceFirstFailureSec = history.firstFailureAt === undefined
            ? 0
            : round((Date.now() - history.firstFailureAt) / 1000)

        log({
            message: 'picker recovered',
            pickerKind: kind,
            failures: history.consecutiveFailures,
            sinceFirstFailureSec,
        })
    }

    history.presented++
    history.consecutiveFailures = 0
    history.firstFailureAt = undefined
    history.lastOutcome = 'presented'
}

/**
 * Records that the picker could not be shown, and logs the error together with the diagnostics.
 */
export const onPickerFailed = (kind: PickerKind, err: any, log: LogFn): void => {
    history.failed++
    history.consecutiveFailures++
    history.firstFailureAt ??= Date.now()
    history.lastOutcome = 'failed'

    log({
        message: 'picker failed',
        errCode: String(err?.code ?? 'unknown'),
        errMessage: String(err?.message ?? err),
        ...getDiagnostics(kind),
    })
}

/** Resets the per-process history. Only for tests. */
export const resetPickerDiagnostics = (): void => {
    history = newHistory()
}
