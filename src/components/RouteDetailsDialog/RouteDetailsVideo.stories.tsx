import React from 'react'
import { View } from 'react-native'
import type { Meta, StoryObj } from '@storybook/react-native-web-vite'
import { fn } from 'storybook/test'
import type { RouteVideoDisplayProps } from 'incyclist-services'
import { RouteDetailsView } from './RouteDetailsView'
import { MOCK_ROUTE_DATA, MOCK_ROUTE_POINTS } from './RouteDetailsView.mock'
import { MOCK_NOW, MOCK_ROUTE_TITLE, MOCK_VIDEO_STATES } from './video/videoStates.mock'
import { MainBackground } from '../../components'

/**
 * Every state a route's video file can be in, on both layouts.
 *
 * Tablet stories render at iPad Air and phone stories at iPhone 15 Pro, landscape - the two real
 * shapes this dialog has to hold. What each story is checking is the same in both: that the
 * notice, the VIDEO stat (tablet) / info-bar suffix and "Video file" row (phone), and the footer
 * buttons all agree with each other and fit without the form below them being pushed off screen.
 *
 * The fixtures carry their own `actions`, so a story shows exactly the buttons the page service
 * would offer for that state - never a set this file decided on.
 */

const videoRouteProps = (video: RouteVideoDisplayProps, overrides = {}): any => ({
    title: MOCK_ROUTE_TITLE,
    compact: false,
    hasGpx: true,
    points: MOCK_ROUTE_POINTS,
    routeData: MOCK_ROUTE_DATA,
    previewUrl: 'https://incyclist.com/preview.jpg',
    isOnline: true,
    totalDistance: { value: 12.3, unit: 'km' },
    totalElevation: { value: 320, unit: 'm' },
    routeType: 'Video - Loop',
    videoFormat: 'mp4',
    // The route itself is fine; whether Start appears is decided by `video.canStart` on top of
    // this, which is exactly what these stories exercise.
    canStart: true,
    showLoopOverwrite: true,
    showNextOverwrite: false,
    showPrev: false,
    loading: false,
    initialSettings: { startPos: { value: 0, unit: 'km' }, realityFactor: 100 },
    prevRides: null,
    attachedWorkout: null,
    onStart: fn(),
    onCancel: fn(),
    onAddWorkout: fn(),
    onClearWorkout: fn(),
    onSettingsChanged: fn().mockResolvedValue({}),
    onUpdateStartPos: fn().mockReturnValue(null),

    video,
    deviceWord: 'iPad',
    videoNow: MOCK_NOW,
    onVideoDownloadPressed: fn(),
    onVideoDownloadConfirmed: fn(),
    onVideoDownloadDismissed: fn(),
    onVideoRetry: fn(),
    onVideoStop: fn(),
    onVideoConfirmAccess: fn(),
    onVideoKeepInstead: fn(),
    onVideoRemovePressed: fn(),
    onVideoRemoveConfirmed: fn(),
    onVideoRemoveDismissed: fn(),
    ...overrides,
})

const meta: Meta<typeof RouteDetailsView> = {
    title: 'Components/RouteDetailsVideo',
    component: RouteDetailsView,
    decorators: [
        (Story) => (
            <MainBackground>
                <View style={{ flex: 1 }}>
                    <Story />
                </View>
            </MainBackground>
        ),
    ],
}

export default meta

type Story = StoryObj<typeof RouteDetailsView>

const TABLET = { viewport: { defaultViewport: 'ipadAir' }, layout: 'fullscreen' } as const
const PHONE = { viewport: { defaultViewport: 'iphone15Pro' }, layout: 'fullscreen' } as const

/** Tablet (`full`): four stats boxes, the notice as a full-width strip under them. */
const tablet = (video: RouteVideoDisplayProps): Story => ({
    args: videoRouteProps(video),
    parameters: TABLET,
})

/** Phone (`compact`): the suffix on the info bar, the notice at the top of the form column. */
const phone = (video: RouteVideoDisplayProps): Story => ({
    args: videoRouteProps(video, { compact: true, deviceWord: 'iPhone' }),
    parameters: PHONE,
})

// --- 1. not found -----------------------------------------------------------

export const NotFound: Story = tablet(MOCK_VIDEO_STATES.notFound)
export const NotFoundPhone: Story = phone(MOCK_VIDEO_STATES.notFound)
export const NotFoundMulti: Story = tablet(MOCK_VIDEO_STATES.notFoundMulti)
export const NotFoundMultiPhone: Story = phone(MOCK_VIDEO_STATES.notFoundMulti)

// --- 2. access lost ---------------------------------------------------------

export const ICloudUnavailable: Story = tablet(MOCK_VIDEO_STATES.iCloudUnavailable)
export const ICloudUnavailablePhone: Story = phone(MOCK_VIDEO_STATES.iCloudUnavailable)

export const AccessNeeded: Story = tablet(MOCK_VIDEO_STATES.accessNeeded)
export const AccessNeededPhone: Story = phone(MOCK_VIDEO_STATES.accessNeeded)

export const AccessNeededNoSiblings: Story = tablet(MOCK_VIDEO_STATES.accessNeededNoSiblings)
export const AccessNeededNoSiblingsPhone: Story = phone(MOCK_VIDEO_STATES.accessNeededNoSiblings)

export const AccessWrongFolder: Story = tablet(MOCK_VIDEO_STATES.accessWrongFolder)
export const AccessWrongFolderPhone: Story = phone(MOCK_VIDEO_STATES.accessWrongFolder)

/** The success line stays put while the route's real state is shown underneath it. */
export const AccessConfirmedThenNotDownloaded: Story = tablet(MOCK_VIDEO_STATES.accessConfirmedThenNotDownloaded)
export const AccessConfirmedThenNotDownloadedPhone: Story = phone(MOCK_VIDEO_STATES.accessConfirmedThenNotDownloaded)

export const AccessConfirmedThenReady: Story = tablet(MOCK_VIDEO_STATES.accessConfirmedThenReady)
export const AccessConfirmedThenReadyPhone: Story = phone(MOCK_VIDEO_STATES.accessConfirmedThenReady)

// --- 3. not enough storage --------------------------------------------------

export const NotEnoughStorage: Story = tablet(MOCK_VIDEO_STATES.notEnoughStorage)
export const NotEnoughStoragePhone: Story = phone(MOCK_VIDEO_STATES.notEnoughStorage)

export const OutOfSpaceMidDownload: Story = tablet(MOCK_VIDEO_STATES.outOfSpaceMidDownload)
export const OutOfSpaceMidDownloadPhone: Story = phone(MOCK_VIDEO_STATES.outOfSpaceMidDownload)

// --- 4. download failed -----------------------------------------------------

export const DownloadFailed: Story = tablet(MOCK_VIDEO_STATES.downloadFailed)
export const DownloadFailedPhone: Story = phone(MOCK_VIDEO_STATES.downloadFailed)

// --- 5. waiting for network -------------------------------------------------

export const WaitingForNetwork: Story = tablet(MOCK_VIDEO_STATES.waitingForNetwork)
export const WaitingForNetworkPhone: Story = phone(MOCK_VIDEO_STATES.waitingForNetwork)

// --- 6. downloading ---------------------------------------------------------

export const Downloading: Story = tablet(MOCK_VIDEO_STATES.downloading)
export const DownloadingPhone: Story = phone(MOCK_VIDEO_STATES.downloading)

/** Carries the extra "removed again after the ride" line and its undo link. */
export const DownloadingThisRide: Story = tablet(MOCK_VIDEO_STATES.downloadingThisRide)
export const DownloadingThisRidePhone: Story = phone(MOCK_VIDEO_STATES.downloadingThisRide)

export const DownloadingMultiPartial: Story = tablet(MOCK_VIDEO_STATES.downloadingMultiPartial)
export const DownloadingMultiPartialPhone: Story = phone(MOCK_VIDEO_STATES.downloadingMultiPartial)

export const DownloadingExternal: Story = tablet(MOCK_VIDEO_STATES.downloadingExternal)
export const DownloadingExternalPhone: Story = phone(MOCK_VIDEO_STATES.downloadingExternal)

// --- 7. stopped (removal pending) -------------------------------------------

export const Cancelled: Story = tablet(MOCK_VIDEO_STATES.cancelled)
export const CancelledPhone: Story = phone(MOCK_VIDEO_STATES.cancelled)

// --- 8. not downloaded ------------------------------------------------------

export const NotDownloaded: Story = tablet(MOCK_VIDEO_STATES.notDownloaded)
export const NotDownloadedPhone: Story = phone(MOCK_VIDEO_STATES.notDownloaded)

export const NotDownloadedMulti: Story = tablet(MOCK_VIDEO_STATES.notDownloadedMulti)
export const NotDownloadedMultiPhone: Story = phone(MOCK_VIDEO_STATES.notDownloadedMulti)

export const NotDownloadedUnknownSize: Story = tablet(MOCK_VIDEO_STATES.notDownloadedUnknownSize)
export const NotDownloadedUnknownSizePhone: Story = phone(MOCK_VIDEO_STATES.notDownloadedUnknownSize)

// --- 9. checking ------------------------------------------------------------

/** Nothing for the first 300 ms, then the "Checking video…" line; Start is held back throughout. */
export const Checking: Story = tablet(MOCK_VIDEO_STATES.checking)
export const CheckingPhone: Story = phone(MOCK_VIDEO_STATES.checking)

// --- 10. ready / unknown ----------------------------------------------------

export const ReadyThisRide: Story = tablet(MOCK_VIDEO_STATES.readyThisRide)
export const ReadyThisRidePhone: Story = phone(MOCK_VIDEO_STATES.readyThisRide)

/** No notice at all - just the VIDEO stat and its Remove download link. */
export const ReadyKept: Story = tablet(MOCK_VIDEO_STATES.readyKept)
export const ReadyKeptPhone: Story = phone(MOCK_VIDEO_STATES.readyKept)

/** The pre-feature baseline: nothing added anywhere, Start as normal. */
export const Unknown: Story = tablet(MOCK_VIDEO_STATES.unknown)
export const UnknownPhone: Story = phone(MOCK_VIDEO_STATES.unknown)

// --- confirmation dialogs ---------------------------------------------------

export const DownloadConfirmation: Story = tablet(MOCK_VIDEO_STATES.downloadConfirmation)
export const DownloadConfirmationPhone: Story = phone(MOCK_VIDEO_STATES.downloadConfirmation)

export const DownloadConfirmationMulti: Story = tablet(MOCK_VIDEO_STATES.downloadConfirmationMulti)
export const DownloadConfirmationMultiPhone: Story = phone(MOCK_VIDEO_STATES.downloadConfirmationMulti)

export const DownloadConfirmationOffline: Story = tablet(MOCK_VIDEO_STATES.downloadConfirmationOffline)
export const DownloadConfirmationOfflinePhone: Story = phone(MOCK_VIDEO_STATES.downloadConfirmationOffline)

/** Space ran out before the tap landed: the facts are replaced and both buttons go dead. */
export const DownloadConfirmationBlocked: Story = tablet(MOCK_VIDEO_STATES.downloadConfirmationBlocked)
export const DownloadConfirmationBlockedPhone: Story = phone(MOCK_VIDEO_STATES.downloadConfirmationBlocked)

export const RemoveConfirmation: Story = tablet(MOCK_VIDEO_STATES.removeConfirmation)
export const RemoveConfirmationPhone: Story = phone(MOCK_VIDEO_STATES.removeConfirmation)

export const RemoveFailed: Story = tablet(MOCK_VIDEO_STATES.removeFailed)
export const RemoveFailedPhone: Story = phone(MOCK_VIDEO_STATES.removeFailed)
