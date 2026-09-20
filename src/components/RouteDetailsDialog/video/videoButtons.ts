/**
 * The footer buttons a route's video state adds to the dialog.
 *
 * The whole point of this module is that it reads `video.actions` and nothing else. Which state
 * produces which button is settled in the page service, where the precedence rules live; here a
 * flag is true or it isn't. That keeps a state name from ever growing a second, divergent
 * interpretation in the UI.
 */

import type { RouteVideoDisplayProps } from 'incyclist-services'
import type { ButtonProps } from '../../ButtonBar/types'
import { VIDEO_BUTTON_LABELS } from './videoCopy'

export interface VideoButtonHandlers {
    onDownload: () => void
    onRetry: () => void
    onStop: () => void
    onConfirmAccess: () => void
}

/**
 * The shared button bar renders a `disabled` button as an ordinary one and still fires its
 * handler, so a button that must not act is given nothing to call as well as the flag. Dropping
 * the handler is what actually holds; the flag is there for the day the bar honours it.
 */
export const inertWhenDisabled = (disabled: boolean, onClick: () => void): (() => void) =>
    (disabled ? () => {} : onClick)

/**
 * `Download` and `Retry Download` are both primary: each is the one thing the dialog is asking
 * the user to do. `Stop Download` is not - stopping is the way out of a state that is already
 * progressing on its own.
 */
export const getVideoButtons = (
    video: RouteVideoDisplayProps | undefined,
    handlers: VideoButtonHandlers
): ButtonProps[] => {
    if (!video)
        return []

    const { actions } = video
    const buttons: ButtonProps[] = []

    if (actions.download) {
        buttons.push({
            label: VIDEO_BUTTON_LABELS.download,
            primary: true,
            disabled: !actions.downloadEnabled,
            onClick: inertWhenDisabled(!actions.downloadEnabled, handlers.onDownload),
        })
    }
    if (actions.retry)
        buttons.push({ label: VIDEO_BUTTON_LABELS.retry, primary: true, onClick: handlers.onRetry })
    if (actions.stop)
        buttons.push({ label: VIDEO_BUTTON_LABELS.stop, onClick: handlers.onStop })
    if (actions.confirmAccess)
        buttons.push({ label: VIDEO_BUTTON_LABELS.confirmAccess, primary: true, onClick: handlers.onConfirmAccess })

    return buttons
}
