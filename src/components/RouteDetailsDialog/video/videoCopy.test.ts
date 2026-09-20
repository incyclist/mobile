import {
    formatBytes, formatElapsed, getAccessConfirmedLine, getDownloadConfirmCopy, getInfoBarSuffix,
    getRemoveConfirmCopy, getVideoFileRow, getVideoNotice, getVideoStat, VideoCopyContext,
} from './videoCopy'
import {
    MOCK_NOW, MOCK_VIDEO_STATES, VIDEO_DOWNLOAD_CONFIRMATION, VIDEO_DOWNLOAD_CONFIRMATION_BLOCKED,
    VIDEO_DOWNLOAD_CONFIRMATION_MULTI, VIDEO_DOWNLOAD_CONFIRMATION_OFFLINE, VIDEO_REMOVE_CONFIRMATION,
} from './videoStates.mock'

const tablet: VideoCopyContext = { deviceWord: 'iPad', compact: false, now: MOCK_NOW }
const phone: VideoCopyContext = { deviceWord: 'iPhone', compact: true, now: MOCK_NOW }

describe('formatBytes', () => {
    it('reads gigabytes to one decimal and megabytes whole', () => {
        expect(formatBytes(Math.round(4.2 * 1024 ** 3))).toBe('4.2 GB')
        expect(formatBytes(512 * 1024 ** 2)).toBe('512 MB')
    })

    // A size the probe could not determine has to disappear from the sentence entirely - a "0 GB"
    // would read as a measured fact.
    it('returns undefined rather than a figure it does not have', () => {
        expect(formatBytes(undefined)).toBeUndefined()
        expect(formatBytes(Number.NaN)).toBeUndefined()
        expect(formatBytes(-1)).toBeUndefined()
    })
})

describe('formatElapsed', () => {
    it('reads as "just now" below a minute, then minutes, then hours and minutes', () => {
        expect(formatElapsed(MOCK_NOW - 30_000, MOCK_NOW)).toBe('just now')
        expect(formatElapsed(MOCK_NOW - 6 * 60_000, MOCK_NOW)).toBe('6 min ago')
        expect(formatElapsed(MOCK_NOW - 80 * 60_000, MOCK_NOW)).toBe('1 h 20 min ago')
        expect(formatElapsed(MOCK_NOW - 120 * 60_000, MOCK_NOW)).toBe('2 h ago')
    })

    it('says nothing for a missing or future start time', () => {
        expect(formatElapsed(undefined, MOCK_NOW)).toBeUndefined()
        expect(formatElapsed(MOCK_NOW + 5_000, MOCK_NOW)).toBeUndefined()
    })
})

describe('getVideoNotice', () => {
    it('says nothing at all when there is no video data, or when the video is simply ready', () => {
        expect(getVideoNotice(undefined, tablet)).toBeNull()
        expect(getVideoNotice(MOCK_VIDEO_STATES.readyKept, tablet)).toBeNull()
        expect(getVideoNotice(MOCK_VIDEO_STATES.unknown, tablet)).toBeNull()
    })

    it('names the device and both figures when the video is in iCloud', () => {
        const notice = getVideoNotice(MOCK_VIDEO_STATES.notDownloaded, tablet)
        expect(notice?.tone).toBe('info')
        expect(notice?.headline).toBe('This video is stored in iCloud, not on this iPad')
        expect(notice?.body).toBe('Download it to ride this route. It needs 4.2 GB — 38.5 GB is free.')
    })

    it('shortens the same notice on the phone', () => {
        const notice = getVideoNotice(MOCK_VIDEO_STATES.notDownloaded, phone)
        expect(notice?.headline).toBe('Stored in iCloud, not on this iPhone')
        expect(notice?.body).toBe('Download it to ride this route. Needs 4.2 GB — 38.5 GB free.')
    })

    it('drops every size phrase when the size is unknown, rather than printing a placeholder', () => {
        const notice = getVideoNotice(MOCK_VIDEO_STATES.notDownloadedUnknownSize, tablet)
        expect(notice?.body).toBe('Download it to ride this route.')
        expect(notice?.body).not.toMatch(/GB|MB|undefined/)
    })

    it('counts the files on a multi-video route and totals their size', () => {
        const notice = getVideoNotice(MOCK_VIDEO_STATES.notDownloadedMulti, tablet)
        expect(notice?.headline).toBe('2 of 3 videos for this route are stored in iCloud, not on this iPad')
        expect(notice?.body).toContain('7.8 GB in total')
    })

    it('puts the elapsed time in the downloading headline and asks for a spinner', () => {
        const notice = getVideoNotice(MOCK_VIDEO_STATES.downloading, tablet)
        expect(notice?.headline).toBe('Downloading from iCloud · 4.2 GB · started 6 min ago')
        expect(notice?.spinner).toBe(true)
    })

    it('adds the "removed after the ride" line and its undo link only for a this-ride download', () => {
        expect(getVideoNotice(MOCK_VIDEO_STATES.downloading, tablet)?.extra).toBeUndefined()

        const thisRide = getVideoNotice(MOCK_VIDEO_STATES.downloadingThisRide, tablet)
        expect(thisRide?.extra).toBe('Removed again when you leave the ride.')
        expect(thisRide?.link).toBe('keep-instead')
    })

    it('mentions the files still to come while one is already downloading', () => {
        const notice = getVideoNotice(MOCK_VIDEO_STATES.downloadingMultiPartial, tablet)
        expect(notice?.body).toContain('1 more video still needs to be downloaded.')
    })

    it('never offers to stop a download Incyclist did not start', () => {
        const notice = getVideoNotice(MOCK_VIDEO_STATES.downloadingExternal, tablet)
        expect(notice?.body).toContain('started outside Incyclist')
        expect(notice?.headline).not.toContain('started')
    })

    it('promises only the outcome after a stop, never that the transfer has ended', () => {
        const notice = getVideoNotice(MOCK_VIDEO_STATES.cancelled, tablet)
        expect(notice?.headline).toBe('Download stopped')
        expect(notice?.body).toContain('won\'t use any space')
    })

    it('states the shortfall and where to free it up before a download starts', () => {
        const notice = getVideoNotice(MOCK_VIDEO_STATES.notEnoughStorage, tablet)
        expect(notice?.tone).toBe('error')
        expect(notice?.body).toContain('This video needs 4.7 GB of free space, but only 1.3 GB is free.')
        expect(notice?.body).toContain('Free up at least 3.4 GB')
    })

    // Same headline, but the user is being told what already happened rather than being stopped.
    it('uses the past tense when the space ran out mid-download', () => {
        const notice = getVideoNotice(MOCK_VIDEO_STATES.outOfSpaceMidDownload, tablet)
        expect(notice?.body).toContain('ran out of space')
        expect(notice?.body).toContain('then try again')
    })

    it('gives no error code for a failed download, only what the user can check', () => {
        const notice = getVideoNotice(MOCK_VIDEO_STATES.downloadFailed, tablet)
        expect(notice?.tone).toBe('error')
        expect(notice?.headline).toBe('The download didn\'t finish')
    })

    it('waits out a network drop without offering an action', () => {
        const notice = getVideoNotice(MOCK_VIDEO_STATES.waitingForNetwork, tablet)
        expect(notice?.tone).toBe('warning')
        expect(notice?.body).toContain('continues by itself when you\'re back online')
    })

    // The same state name, two entirely different situations - one the user can fix with a tap,
    // one that resolves on its own.
    it('splits access-lost into the transient iCloud case and the confirm-access case', () => {
        const transient = getVideoNotice(MOCK_VIDEO_STATES.iCloudUnavailable, tablet)
        expect(transient?.headline).toBe('iCloud Drive isn\'t available right now')
        expect(transient?.body).not.toContain('Confirm Access')

        const needsAccess = getVideoNotice(MOCK_VIDEO_STATES.accessNeeded, tablet)
        expect(needsAccess?.headline).toBe('Incyclist needs your OK to use this video\'s folder again')
        expect(needsAccess?.body).toContain('the folder iCloud Drive › Videos opens already selected')
    })

    it('promises the sibling routes only when the folder actually holds some', () => {
        expect(getVideoNotice(MOCK_VIDEO_STATES.accessNeeded, tablet)?.body)
            .toContain('This also restores the other routes in that folder.')
        expect(getVideoNotice(MOCK_VIDEO_STATES.accessNeededNoSiblings, tablet)?.body)
            .not.toContain('also restores')
    })

    it('leads with the wrong-folder correction and keeps the instruction underneath', () => {
        const notice = getVideoNotice(MOCK_VIDEO_STATES.accessWrongFolder, tablet)
        expect(notice?.body).toMatch(/^That folder doesn't contain this video\. Please choose iCloud Drive › Videos\./)
        expect(notice?.body).toContain('Tap Confirm Access')
    })

    it('names the affected part of a multi-video route that is missing', () => {
        expect(getVideoNotice(MOCK_VIDEO_STATES.notFound, tablet)?.headline)
            .toBe('The video file can\'t be found')
        expect(getVideoNotice(MOCK_VIDEO_STATES.notFoundMulti, tablet)?.headline)
            .toBe('Part 2 of this route can\'t be found')
    })

    // A check that resolves quickly should never flash a message; the delay is carried as data so
    // the view does not have to know which state it belongs to.
    it('asks for a delay before the checking message is worth showing', () => {
        const notice = getVideoNotice(MOCK_VIDEO_STATES.checking, tablet)
        expect(notice?.headline).toBe('Checking video…')
        expect(notice?.delayMs).toBe(300)
    })

    it('warns before the ride that a this-ride video will be removed, and offers the undo', () => {
        const notice = getVideoNotice(MOCK_VIDEO_STATES.readyThisRide, tablet)
        expect(notice?.headline).toBe('Downloaded for this ride')
        expect(notice?.body).toBe('This video is removed from this iPad again when you leave the ride.')
        expect(notice?.link).toBe('keep-instead')
    })
})

describe('getAccessConfirmedLine', () => {
    it('stays silent until a confirmation actually covered this route', () => {
        expect(getAccessConfirmedLine(MOCK_VIDEO_STATES.accessNeeded)).toBeNull()
        expect(getAccessConfirmedLine(MOCK_VIDEO_STATES.accessWrongFolder)).toBeNull()
    })

    it('mentions the other routes and their pictures once more than one was restored', () => {
        expect(getAccessConfirmedLine(MOCK_VIDEO_STATES.accessConfirmedThenReady))
            .toContain('including their preview pictures')
    })

    // The route's own state still has to be shown underneath, so the success line never replaces
    // the notice - both are produced, independently.
    it('coexists with the notice for whatever state the route turned out to be in', () => {
        expect(getAccessConfirmedLine(MOCK_VIDEO_STATES.accessConfirmedThenNotDownloaded)).toBeTruthy()
        expect(getVideoNotice(MOCK_VIDEO_STATES.accessConfirmedThenNotDownloaded, tablet)?.headline)
            .toContain('stored in iCloud')
    })
})

describe('getVideoStat', () => {
    it('is left out entirely for a video that is not in iCloud', () => {
        expect(getVideoStat(MOCK_VIDEO_STATES.unknown)).toBeNull()
    })

    it('is left out for states the notice already explains in full', () => {
        expect(getVideoStat(MOCK_VIDEO_STATES.notFound)).toBeNull()
        expect(getVideoStat(MOCK_VIDEO_STATES.accessNeeded)).toBeNull()
        expect(getVideoStat(MOCK_VIDEO_STATES.downloadFailed)).toBeNull()
    })

    it('states the situation in two short lines', () => {
        expect(getVideoStat(MOCK_VIDEO_STATES.notDownloaded))
            .toEqual({ value: 'In iCloud', sub: '4.2 GB · not downloaded' })
        expect(getVideoStat(MOCK_VIDEO_STATES.notDownloadedMulti))
            .toEqual({ value: 'In iCloud', sub: '2 of 3 not downloaded' })
        expect(getVideoStat(MOCK_VIDEO_STATES.downloading))
            .toEqual({ value: 'Downloading…', sub: '4.2 GB' })
        expect(getVideoStat(MOCK_VIDEO_STATES.waitingForNetwork))
            .toEqual({ value: 'Waiting for internet', sub: '4.2 GB' })
    })

    it('asks for the Remove download link only on a video that is being kept', () => {
        expect(getVideoStat(MOCK_VIDEO_STATES.readyKept))
            .toEqual({ value: 'Downloaded', sub: '4.2 GB', link: 'remove-download' })
        expect(getVideoStat(MOCK_VIDEO_STATES.readyThisRide))
            .toEqual({ value: 'Downloaded', sub: '4.2 GB · for this ride only' })
    })
})

describe('getInfoBarSuffix and getVideoFileRow (phone)', () => {
    it('adds nothing to the info bar for a video that is not in iCloud', () => {
        expect(getInfoBarSuffix(MOCK_VIDEO_STATES.unknown)).toBeNull()
    })

    it('suffixes the info bar with the short form of the state', () => {
        expect(getInfoBarSuffix(MOCK_VIDEO_STATES.notDownloaded)).toBe('In iCloud · 4.2 GB')
        expect(getInfoBarSuffix(MOCK_VIDEO_STATES.downloading)).toBe('Downloading')
        expect(getInfoBarSuffix(MOCK_VIDEO_STATES.waitingForNetwork)).toBe('Download paused (offline)')
        expect(getInfoBarSuffix(MOCK_VIDEO_STATES.readyKept)).toBe('Downloaded')
        expect(getInfoBarSuffix(MOCK_VIDEO_STATES.readyThisRide)).toBe('Downloaded (this ride)')
    })

    it('shows the "Video file" row only once the video is actually on the device', () => {
        expect(getVideoFileRow(MOCK_VIDEO_STATES.notDownloaded, phone)).toBeNull()
        expect(getVideoFileRow(MOCK_VIDEO_STATES.readyKept, phone)).toEqual({
            text: 'Video file — Downloaded to this iPhone · 4.2 GB',
            link: 'remove-download',
        })
    })
})

describe('getDownloadConfirmCopy', () => {
    it('names the route, the device and the two figures', () => {
        const copy = getDownloadConfirmCopy(VIDEO_DOWNLOAD_CONFIRMATION.confirmation!, tablet)
        expect(copy.title).toBe('Download this video?')
        expect(copy.intro).toContain('"Col de Pennes" is stored in iCloud Drive, not on this iPad')
        expect(copy.facts).toEqual([
            { label: 'Size', value: '4.2 GB' },
            { label: 'Free space', value: '38.5 GB on this iPad' },
            { label: 'Time', value: expect.stringContaining('Can take a while') },
        ])
    })

    it('switches to the plural title and intro for a multi-video route', () => {
        const copy = getDownloadConfirmCopy(VIDEO_DOWNLOAD_CONFIRMATION_MULTI.confirmation!, tablet)
        expect(copy.title).toBe('Download these videos?')
        expect(copy.intro).toContain('3 videos for "Col de Pennes"')
    })

    it('adds the offline line, which promises a start rather than a failure', () => {
        expect(getDownloadConfirmCopy(VIDEO_DOWNLOAD_CONFIRMATION.confirmation!, tablet).offline)
            .toBeUndefined()
        expect(getDownloadConfirmCopy(VIDEO_DOWNLOAD_CONFIRMATION_OFFLINE.confirmation!, tablet).offline)
            .toContain('starts by itself as soon as you\'re back online')
    })

    // `blocked` is handed in by the caller from the page service's own flag, never worked out here
    // by comparing the sizes in the props.
    it('replaces the facts with a reason when the caller says the download is blocked', () => {
        const copy = getDownloadConfirmCopy(
            VIDEO_DOWNLOAD_CONFIRMATION_BLOCKED.confirmation!, tablet, { blocked: true }
        )
        expect(copy.blocked).toContain('isn\'t enough free space on this iPad')
    })

    it('collapses the facts to a single line on the phone', () => {
        const copy = getDownloadConfirmCopy(VIDEO_DOWNLOAD_CONFIRMATION.confirmation!, phone)
        expect(copy.factsLine).toBe('4.2 GB · 38.5 GB free · can take a while')
    })
})

describe('getRemoveConfirmCopy', () => {
    // The wording has to keep "remove" away from both iCloud Drive and the route itself.
    it('says what is freed, what stays, and what it costs to undo', () => {
        const copy = getRemoveConfirmCopy(VIDEO_REMOVE_CONFIRMATION.removeConfirmation!, tablet)
        expect(copy.title).toBe('Remove download?')
        expect(copy.body[0]).toBe(
            'This frees 4.2 GB on this iPad. The video stays in iCloud Drive, and the route stays in Incyclist.'
        )
        expect(copy.body[1]).toContain('you\'ll need to download it again')
    })
})
