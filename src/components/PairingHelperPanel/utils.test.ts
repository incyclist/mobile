import type { PairingHelperReasonProps } from 'incyclist-services'
import { getVisibleReasons } from './utils'

const reason = (id: PairingHelperReasonProps['id'], selected = false): PairingHelperReasonProps => ({
    id, label: id, selected, onSelect: jest.fn(),
})

const ids = (list: PairingHelperReasonProps[]) => list.map(r => r.id)

describe('getVisibleReasons', () => {
    it('shows every answer until one is picked', () => {
        const reasons = [reason('asleep'), reason('other_app'), reason('unsure')]
        expect(ids(getVisibleReasons(reasons, { fold: true, expanded: false }).visible)).toEqual(['asleep', 'other_app', 'unsure'])
        expect(getVisibleReasons(reasons, { fold: true, expanded: false }).folded).toBe(false)
    })

    it('folds the other answers away once one is picked', () => {
        const reasons = [reason('asleep'), reason('other_app', true), reason('unsure')]
        const result = getVisibleReasons(reasons, { fold: true, expanded: false })
        expect(ids(result.visible)).toEqual(['other_app'])
        expect(result.folded).toBe(true)
    })

    it('shows them again when the rider asks for the other answers', () => {
        const reasons = [reason('asleep'), reason('other_app', true), reason('unsure')]
        const result = getVisibleReasons(reasons, { fold: true, expanded: true })
        expect(ids(result.visible)).toEqual(['asleep', 'other_app', 'unsure'])
        expect(result.folded).toBe(false)
    })

    it('never folds where folding is off', () => {
        const reasons = [reason('asleep', true), reason('unsure')]
        const result = getVisibleReasons(reasons, { fold: false, expanded: false })
        expect(ids(result.visible)).toEqual(['asleep', 'unsure'])
        expect(result.folded).toBe(false)
    })
})
