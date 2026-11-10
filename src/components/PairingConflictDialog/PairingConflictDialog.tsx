import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { useWindowDimensions } from 'react-native'
import type { ConflictStepProps } from 'incyclist-services'

import { useLogging, useScreenLayout } from '../../hooks'
import { Dialog } from '../Dialog'
import { ButtonProps } from '../ButtonBar/types'
import { ConflictStepBody } from '../ConflictStepRows'
import { getDeviceDialogWidth } from '../DeviceSelector/utils'
import { PairingConflictDialogProps } from './types'

/**
 * How long Keep, Use and Done ignore taps after a conflict appears. The dialog opens by itself when
 * the search finds a device, possibly while the rider is about to tap something else on the page.
 */
export const ARMING_DELAY_MS = 500

const DONE_LABEL = 'Done'

type TapControl = 'choice' | 'done'

/**
 * A device found by the search wants slots that already hold a different device: the rider picks,
 * per slot, which device to keep. The same dialog, at the same size, as the device list's own
 * conflict step. Done applies the choices; a tap outside or the back button go to the conflict's
 * `onDismiss`, right away, even during the arming delay.
 */
export const PairingConflictDialog = ({ conflict }: PairingConflictDialogProps) => {
    const { logEvent } = useLogging('PairingConflictDialog')
    const { width: screenWidth } = useWindowDimensions()
    const compact = useScreenLayout() === 'compact'
    const refArmed = useRef<boolean>(false)

    // armed again for every new conflict: the next one in the queue takes this one's place right
    // after Done, under the finger that just tapped it
    useEffect(() => {
        refArmed.current = false
        const timer = setTimeout(() => { refArmed.current = true }, ARMING_DELAY_MS)
        return () => clearTimeout(timer)
    }, [conflict.id])

    const isArmed = useCallback((control: TapControl): boolean => {
        if (refArmed.current)
            return true
        logEvent({ message: 'conflict tap ignored', control, conflictId: conflict.id, delay: ARMING_DELAY_MS })
        return false
    }, [logEvent, conflict.id])

    const onChoice = useCallback<ConflictStepProps['onChoice']>((capability, choice) => {
        if (isArmed('choice'))
            conflict.onChoice(capability, choice)
    }, [isArmed, conflict])

    const onDone = useCallback(() => {
        if (isArmed('done'))
            conflict.onDone()
    }, [isArmed, conflict])

    const onOutsideClick = useCallback(() => {
        conflict.onDismiss()
    }, [conflict])

    const buttons = useMemo<ButtonProps[]>(() => [
        { id: 'conflict-done', label: DONE_LABEL, primary: true, onClick: onDone },
    ], [onDone])

    const dialogStyle = { width: getDeviceDialogWidth(screenWidth) }

    return (
        <Dialog
            style={dialogStyle}
            title={conflict.title}
            onOutsideClick={onOutsideClick}
            buttons={buttons}
        >
            <ConflictStepBody step={conflict} compact={compact} onChoice={onChoice} />
        </Dialog>
    )
}
