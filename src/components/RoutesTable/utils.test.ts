import type { RouteItemProps } from 'incyclist-services';
import { areRoutesEqual } from './utils';

const route = (id: string, extra = {}) => ({ id, title: id, ...extra }) as unknown as RouteItemProps;

describe('areRoutesEqual', () => {
    test('the same routes in the same order are equal, also when the objects are new', () => {
        expect(areRoutesEqual([route('a'), route('b')], [route('a'), route('b')])).toBe(true);
    });

    test('a different length or order is not equal', () => {
        expect(areRoutesEqual([route('a')], [route('a'), route('b')])).toBe(false);
        expect(areRoutesEqual([route('a'), route('b')], [route('b'), route('a')])).toBe(false);
    });

    test('a change of where a route plays from is not equal', () => {
        const base = [route('a', { availability: 'unavailable', unavailableReason: 'linkUnreachable', sourceLabel: 'Den PC' })];
        expect(areRoutesEqual(base, [route('a', { availability: 'fromLink', sourceLabel: 'Den PC' })])).toBe(false);
        expect(areRoutesEqual(base, [route('a', { availability: 'unavailable', unavailableReason: 'linkNeverReached', sourceLabel: 'Den PC' })])).toBe(false);
        expect(areRoutesEqual(base, [route('a', { availability: 'unavailable', unavailableReason: 'linkUnreachable', sourceLabel: 'Mac' })])).toBe(false);
    });

    test('a change of the thumbnail source is not equal', () => {
        const link = (thumbHandle: string) => route('a', { thumbnailLink: { linkId: 'l', thumbHandle } });
        expect(areRoutesEqual([link('t1')], [link('t1')])).toBe(true);
        expect(areRoutesEqual([link('t1')], [link('t2')])).toBe(false);
        expect(areRoutesEqual([route('a')], [link('t1')])).toBe(false);
    });

    test('other changes of a row reach it through its own observer and do not render the table again', () => {
        expect(areRoutesEqual([route('a', { title: 'x' })], [route('a', { title: 'y' })])).toBe(true);
    });

    test('undefined lists', () => {
        expect(areRoutesEqual(undefined, undefined)).toBe(true);
        expect(areRoutesEqual(undefined, [])).toBe(false);
    });
});
