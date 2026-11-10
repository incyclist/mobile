import { AppState } from 'react-native'
import {
    isPickerCancel,
    onPickerFailed,
    onPickerPresented,
    resetPickerDiagnostics,
} from './pickerDiagnostics'

describe('pickerDiagnostics', () => {
    const log = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
        resetPickerDiagnostics()
    })

    afterEach(() => {
        jest.useRealTimers()
    })

    describe('isPickerCancel', () => {
        it.each(['DOCUMENT_PICKER_CANCELED', 'OPERATION_CANCELED'])('treats %s as a cancel', code => {
            expect(isPickerCancel({ code })).toBe(true)
        })

        it.each([{ code: 'NULL_PRESENTER' }, new Error('x'), undefined, null])('does not treat %p as a cancel', err => {
            expect(isPickerCancel(err)).toBe(false)
        })
    })

    describe('onPickerFailed', () => {
        it('logs the error with the diagnostics', () => {
            onPickerFailed('file', { code: 'NULL_PRESENTER', message: 'RCTPresentedViewController was nil' }, log)

            expect(log).toHaveBeenCalledWith(expect.objectContaining({
                message: 'picker failed',
                pickerKind: 'file',
                errCode: 'NULL_PRESENTER',
                errMessage: 'RCTPresentedViewController was nil',
                appState: AppState.currentState,
                pickerPresented: 0,
                pickerFailed: 1,
                consecutiveFailures: 1,
                lastPickerOutcome: 'failed',
            }))
            expect(log).toHaveBeenCalledWith(expect.objectContaining({
                screenWidth: expect.any(Number),
                screenHeight: expect.any(Number),
                windowWidth: expect.any(Number),
                windowHeight: expect.any(Number),
                osVersion: expect.any(String),
                isPad: expect.any(Boolean),
            }))
        })

        it('falls back to "unknown" if the error has no code', () => {
            onPickerFailed('directory', new Error('boom'), log)

            expect(log).toHaveBeenCalledWith(expect.objectContaining({
                pickerKind: 'directory',
                errCode: 'unknown',
                errMessage: 'boom',
            }))
        })

        it('counts consecutive failures and reports the previous outcome', () => {
            onPickerFailed('file', { code: 'NULL_PRESENTER' }, log)
            onPickerFailed('directory', { code: 'NULL_PRESENTER' }, log)

            expect(log).toHaveBeenLastCalledWith(expect.objectContaining({
                pickerFailed: 2,
                consecutiveFailures: 2,
                lastPickerOutcome: 'failed',
            }))
        })
    })

    describe('onPickerPresented', () => {
        it('logs nothing if there was no failure before', () => {
            onPickerPresented('file', log)

            expect(log).not.toHaveBeenCalled()
        })

        it('logs how long the failure condition lasted when the picker works again', () => {
            jest.useFakeTimers()
            jest.setSystemTime(new Date('2026-11-09T18:00:00Z'))

            onPickerFailed('file', { code: 'NULL_PRESENTER' }, log)
            onPickerFailed('file', { code: 'NULL_PRESENTER' }, log)
            jest.setSystemTime(new Date('2026-11-09T18:01:30Z'))
            log.mockClear()

            onPickerPresented('directory', log)

            expect(log).toHaveBeenCalledWith({
                message: 'picker recovered',
                pickerKind: 'directory',
                failures: 2,
                sinceFirstFailureSec: 90,
            })
        })

        it('starts a new failure streak after a recovery', () => {
            onPickerFailed('file', { code: 'NULL_PRESENTER' }, log)
            onPickerPresented('file', log)
            log.mockClear()

            onPickerFailed('file', { code: 'NULL_PRESENTER' }, log)

            expect(log).toHaveBeenCalledWith(expect.objectContaining({
                pickerPresented: 1,
                pickerFailed: 2,
                consecutiveFailures: 1,
            }))
        })
    })
})
