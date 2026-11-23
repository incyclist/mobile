import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { RouteSourceInfo } from './RouteSourceInfo';
import { RouteSourceExplainer } from './RouteSourceExplainer';
import { RouteSourcePill } from './RouteSourcePill';
import {
    getExplainerText, getHintText, getPlaysFromText, getSourceLostText, getSublineText, getUnavailableText,
    getUnreachableComputers, getWhatToDoText,
} from './utils';

describe('RouteSource copy', () => {
    test('sub-line of a list row', () => {
        expect(getSublineText({ availability: 'fromLink', sourceLabel: 'Den PC' })).toBe('• Den PC');
        expect(getSublineText({ availability: 'unavailable', sourceLabel: 'Den PC' })).toBe('• Needs Den PC');
        expect(getSublineText({ availability: 'local' })).toBeUndefined();
        expect(getSublineText({ availability: 'remote', sourceLabel: 'Den PC' })).toBeUndefined();
        expect(getSublineText({ availability: 'unavailable' })).toBeUndefined();
    });

    test('reason of an unavailable route', () => {
        expect(getUnavailableText({ unavailableReason: 'linkUnreachable', sourceLabel: 'Den PC' })).toBe("Needs Den PC — can't reach it right now");
        expect(getUnavailableText({ unavailableReason: 'linkNeverReached', sourceLabel: 'Den PC' })).toBe('Needs Den PC — this device has never been able to reach it');
        expect(getUnavailableText({ unavailableReason: 'versionMismatch', sourceLabel: 'Den PC' }))
            .toBe("Den PC is running a version of Incyclist that can't share routes with this app — update it");
        expect(getUnavailableText({ unavailableReason: 'noSource' })).toBe("This route isn't on this device or on any of your computers");
        expect(getUnavailableText({ unavailableReason: 'linkUnreachable' })).toBe("Needs a computer that can't be reached right now");
        expect(getUnavailableText({})).toBeUndefined();
    });

    test('what to do', () => {
        expect(getWhatToDoText({ unavailableReason: 'linkUnreachable', sourceLabel: 'Den PC' }))
            .toBe('Open Incyclist on Den PC and use the same Wi‑Fi on both, then pull the list down. More help: Settings › Routes › Route Sharing.');
        expect(getWhatToDoText({ unavailableReason: 'linkNeverReached', sourceLabel: 'Den PC' }))
            .toBe('See Settings › Routes › Route Sharing › Den PC for what to check.');
        expect(getWhatToDoText({ unavailableReason: 'linkNeverReached' })).toBe('See Settings › Routes › Route Sharing for what to check.');
        expect(getWhatToDoText({ unavailableReason: 'noSource' })).toBeUndefined();
    });

    test('source and hint of a route that plays from a computer', () => {
        expect(getPlaysFromText('Den PC')).toBe('Plays from Den PC');
        expect(getPlaysFromText()).toBeUndefined();
        expect(getHintText('Den PC', false)).toBe("Plays only while Den PC is on and you're on the same Wi‑Fi. Download it to ride anywhere.");
        expect(getHintText('Den PC', true)).toBe('Download to ride without Den PC.');
        expect(getHintText('Den PC', false, 4_200_000_000)).toBe("Plays only while Den PC is on and you're on the same Wi‑Fi. Download it (4.2 GB) to ride anywhere.");
        expect(getHintText('Den PC', true, 850_000_000)).toBe('Download (850 MB) to ride without Den PC.');
    });

    test('explainer', () => {
        expect(getExplainerText([])).toBeUndefined();
        expect(getExplainerText(['Den PC'])).toBe("Some routes need Den PC — it can't be reached right now.");
        expect(getExplainerText(['Den PC', 'Mac'])).toBe("Some routes need a computer that can't be reached right now.");
    });

    test('computers that are needed and can not be reached, each named once', () => {
        const routes = [
            { availability: 'unavailable', unavailableReason: 'linkUnreachable', sourceLabel: 'Den PC' },
            { availability: 'unavailable', unavailableReason: 'linkNeverReached', sourceLabel: 'Den PC' },
            { availability: 'unavailable', unavailableReason: 'noSource' },
            { availability: 'unavailable', unavailableReason: 'versionMismatch', sourceLabel: 'Old PC' },
            { availability: 'fromLink', sourceLabel: 'Mac' },
        ] as any[];
        expect(getUnreachableComputers(routes)).toEqual(['Den PC']);
        expect(getUnreachableComputers(undefined)).toEqual([]);
    });

    test('in-ride notice', () => {
        expect(getSourceLostText('Den PC')).toBe("Video stopped — Den PC isn't reachable.<br>Your ride is still being recorded.");
    });
});

describe('RouteSource components', () => {
    test('pill renders for a computer source and for a needed computer only', () => {
        expect(render(<RouteSourcePill availability="fromLink" />).toJSON()).not.toBeNull();
        expect(render(<RouteSourcePill availability="unavailable" />).toJSON()).not.toBeNull();
        expect(render(<RouteSourcePill availability="local" />).toJSON()).toBeNull();
        expect(render(<RouteSourcePill />).toJSON()).toBeNull();
    });

    test('info renders for both states and not for the others', () => {
        expect(render(<RouteSourceInfo availability="fromLink" sourceLabel="Den PC" />).toJSON()).not.toBeNull();
        expect(render(<RouteSourceInfo availability="unavailable" unavailableReason="linkUnreachable" sourceLabel="Den PC" />).toJSON()).not.toBeNull();
        expect(render(<RouteSourceInfo availability="local" />).toJSON()).toBeNull();
    });

    test('explainer is dismissible and renders nothing without a computer', () => {
        const onDismiss = jest.fn();
        const { getByLabelText } = render(<RouteSourceExplainer computerNames={['Den PC']} onDismiss={onDismiss} />);
        fireEvent.press(getByLabelText('Dismiss'));
        expect(onDismiss).toHaveBeenCalledTimes(1);
        expect(render(<RouteSourceExplainer computerNames={[]} onDismiss={onDismiss} />).toJSON()).toBeNull();
    });
});
