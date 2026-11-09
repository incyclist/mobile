import React from 'react';
import { StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { CapabilityTile } from './CapabilityTile';
import { CapabilityDisplayProps } from 'incyclist-services';
import { colors } from '../../theme';

const mockLogEvent = jest.fn();
jest.mock('../../hooks', () => ({
    useLogging: () => ({
        logEvent: mockLogEvent,
    }),
}));

const buildTile = (props: Partial<CapabilityDisplayProps> = {}) => ({
    title: 'Power',
    capability: 'power',
    deviceName: 'Tacx Neo',
    value: '100',
    unit: 'W',
    awaited: false,
    onClick: jest.fn(),
    onUnselect: jest.fn(),
    ...props,
} as CapabilityDisplayProps & { onUnselect?: () => void });

describe('CapabilityTile use toggle', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('shows the use toggle on a tile with a selected device', () => {
        const { getByLabelText } = render(<CapabilityTile {...buildTile()} height={120} />);
        expect(getByLabelText('Use Power')).toBeTruthy();
    });

    it('does not show the toggle on an empty tile', () => {
        const { queryByLabelText } = render(<CapabilityTile {...buildTile({ deviceName: undefined, value: undefined, unit: undefined })} height={120} />);
        expect(queryByLabelText('Use Power')).toBeNull();
    });

    it('does not show the toggle when the tile offers no unselect', () => {
        const { queryByLabelText } = render(<CapabilityTile {...buildTile({ onUnselect: undefined })} height={120} />);
        expect(queryByLabelText('Use Power')).toBeNull();
    });

    it('switching the toggle off unselects, logs the change and does not open the device list', () => {
        const tile = buildTile();
        const { getByLabelText } = render(<CapabilityTile {...tile} height={120} />);

        fireEvent.press(getByLabelText('Use Power'));

        expect(tile.onUnselect).toHaveBeenCalledTimes(1);
        expect(tile.onClick).not.toHaveBeenCalled();
        expect(mockLogEvent).toHaveBeenCalledWith({ message: 'toggle changed', toggle: 'use', capability: 'power', value: false });
    });

    it('T16b: switched off with nothing remembered shows a plain tile, no toggle, and the full footer copy', () => {
        const { getByText, queryByText, queryByLabelText } = render(<CapabilityTile {...buildTile({
            deviceName: undefined, value: undefined, unit: undefined, onUnselect: undefined,
            disabled: true, emptyFooter: 'Not used · tap to search',
        })} height={120} variant="full" />);

        expect(getByText('Not used · tap to search')).toBeTruthy();
        expect(queryByText('Click to enable')).toBeNull();
        expect(queryByLabelText('Use Power')).toBeNull();
    });

    it('the phone (short) variant shows the footer copy as the page service sends it, unchanged', () => {
        const { getByText } = render(<CapabilityTile {...buildTile({
            deviceName: undefined, value: undefined, unit: undefined, onUnselect: undefined,
            disabled: true, emptyFooter: 'Not used · tap to search',
        })} height={120} variant="short" />);

        expect(getByText('Not used · tap to search')).toBeTruthy();
    });
});

describe('CapabilityTile footer/toggle layout', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('the connect-state text is a single line, so it cannot overlap the toggle next to it', () => {
        const { getByText } = render(<CapabilityTile {...buildTile({ connectState: 'connecting' })} height={90} variant="short" />);

        expect(getByText('Connecting…').props.numberOfLines).toBe(1);
    });

    it('phone (short variant) uses a smaller connect-state font than tablet (full), to make room for the toggle', () => {
        const short = render(<CapabilityTile {...buildTile({ connectState: 'connecting' })} height={90} variant="short" />);
        const full = render(<CapabilityTile {...buildTile({ connectState: 'connecting' })} height={90} variant="full" />);

        const flatten = (style: unknown) => Object.assign({}, ...(Array.isArray(style) ? style.filter(Boolean) : [style]));

        const shortSize = flatten(short.getByText('Connecting…').props.style).fontSize;
        const fullSize = flatten(full.getByText('Connecting…').props.style).fontSize;

        expect(shortSize).toBeLessThan(fullSize);
    });

    it('the toggle sits beside the state text as a normal flex sibling, not an absolute overlay on top of it', () => {
        const { getByLabelText } = render(<CapabilityTile {...buildTile({ connectState: 'connecting' })} height={90} variant="short" />);

        const style = StyleSheet.flatten(getByLabelText('Use Power').props.style);

        expect(style.position).not.toBe('absolute');
    });

    it('the toggle only takes the footprint of the scaled-down switch (iOS: 0.7 x the 65x31 switch box), not its unscaled size', () => {
        const { getByLabelText } = render(<CapabilityTile {...buildTile({ connectState: 'connecting' })} height={120} variant="full" />);

        const style = StyleSheet.flatten(getByLabelText('Use Power').props.style);

        expect(style.width).toBe(46);
        expect(style.height).toBe(22);
    });

    it('the toggle can be tapped within at least a 44pt tall area, even though the switch is drawn smaller', () => {
        const tile = buildTile({ connectState: 'connected' });
        const { getByLabelText } = render(<CapabilityTile {...tile} height={120} variant="full" />);
        const toggle = getByLabelText('Use Power');

        const height = StyleSheet.flatten(toggle.props.style).height;
        const { top = 0, bottom = 0 } = toggle.props.hitSlop ?? {};
        expect(height + top + bottom).toBeGreaterThanOrEqual(44);

        fireEvent.press(toggle);
        expect(tile.onUnselect).toHaveBeenCalledTimes(1);
    });

    it('the switch inside the toggle does not take touches itself, so a tap is handled once, by the toggle', () => {
        const { UNSAFE_getByType } = render(<CapabilityTile {...buildTile({ connectState: 'connected' })} height={120} variant="full" />);

        expect(UNSAFE_getByType(Switch).parent?.props.pointerEvents).toBe('none');
    });
});

describe('CapabilityTile footer text fit', () => {

    const footers: Array<[string, Partial<CapabilityDisplayProps>, string]> = [
        ['connect state of an active device', { connectState: 'connecting' }, 'Connecting…'],
        ['footer of a switched-off tile', { value: undefined, unit: undefined, disabled: true, emptyFooter: 'Not used', onUse: jest.fn() }, 'NOT USED'],
        ['footer of an empty tile', { deviceName: undefined, value: undefined, unit: undefined, emptyFooter: 'Tap to search' }, 'Tap to search'],
    ];

    it.each(footers)('on a tablet, the %s stays on one line and shrinks to at most 75%% to fit', (_name, props, text) => {
        const { getByText } = render(<CapabilityTile {...buildTile(props)} height={120} variant="full" />);
        const footer = getByText(text);

        expect(footer.props.numberOfLines).toBe(1);
        expect(footer.props.adjustsFontSizeToFit).toBe(true);
        expect(footer.props.minimumFontScale).toBe(0.75);
    });

    it.each(footers)('on a phone, the %s does not shrink', (_name, props, text) => {
        const { getByText } = render(<CapabilityTile {...buildTile(props)} height={120} variant="short" />);
        const footer = getByText(text);

        expect(footer.props.adjustsFontSizeToFit).toBeFalsy();
        expect(footer.props.minimumFontScale).toBeUndefined();
    });
});

describe('CapabilityTile T16 (switched off, device remembered)', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    const buildSwitchedOffTile = (props: Partial<CapabilityDisplayProps> = {}) => buildTile({
        value: undefined, unit: undefined, onUnselect: undefined,
        disabled: true, emptyFooter: 'Not used',
        onUse: jest.fn(),
        ...props,
    });

    it('shows the remembered device name and the footer, dimmed, with no value', () => {
        const { getByText, queryByText } = render(<CapabilityTile {...buildSwitchedOffTile()} height={120} />);

        expect(getByText('Tacx Neo')).toBeTruthy();
        expect(getByText('NOT USED')).toBeTruthy();
        expect(queryByText('100')).toBeNull();
    });

    it('shows the toggle, in the off position', () => {
        const { getByLabelText, UNSAFE_getByType } = render(<CapabilityTile {...buildSwitchedOffTile()} height={120} />);
        const toggle = getByLabelText('Use Power');

        expect(toggle).toBeTruthy();
        expect(toggle.props.accessibilityState).toEqual({ checked: false });
        expect(UNSAFE_getByType(Switch).props.value).toBe(false);
    });

    it('switching the toggle on restores the device with no scan, and does not open the device list', () => {
        const tile = buildSwitchedOffTile();
        const { getByLabelText } = render(<CapabilityTile {...tile} height={120} />);

        fireEvent.press(getByLabelText('Use Power'));

        expect(tile.onUse).toHaveBeenCalledTimes(1);
        expect(tile.onClick).not.toHaveBeenCalled();
        expect(mockLogEvent).toHaveBeenCalledWith({ message: 'toggle changed', toggle: 'use', capability: 'power', value: true });
    });

    it('tapping the rest of the tile still opens the device list, to browse', () => {
        const tile = buildSwitchedOffTile();
        const { getByText } = render(<CapabilityTile {...tile} height={120} />);

        fireEvent.press(getByText('Tacx Neo'));

        expect(tile.onClick).toHaveBeenCalledTimes(1);
    });
});

describe('CapabilityTile waiting outline', () => {

    const borderColorOf = (root: ReturnType<typeof render>['UNSAFE_root']) =>
        StyleSheet.flatten(root.findByType(TouchableOpacity).props.style).borderColor;

    it('shows the amber outline when the page waits for the tile', () => {
        const { UNSAFE_root } = render(<CapabilityTile {...buildTile({ deviceName: undefined, awaited: true })} height={120} />);
        expect(borderColorOf(UNSAFE_root)).toBe(colors.pairingWaiting);
    });

    it('shows the outline on a tile with a device, e.g. a trainer that cannot be reached', () => {
        const { UNSAFE_root } = render(<CapabilityTile {...buildTile({ deviceName: 'Tacx Flux', connectState: 'failed', awaited: true })} height={120} />);
        expect(borderColorOf(UNSAFE_root)).toBe(colors.pairingWaiting);
    });

    it('shows no outline when the page does not wait for the tile', () => {
        const { UNSAFE_root } = render(<CapabilityTile {...buildTile({ deviceName: undefined, awaited: false })} height={120} />);
        expect(borderColorOf(UNSAFE_root)).toBeUndefined();
    });
});

describe('CapabilityTile fill colour', () => {

    const fillOf = (root: ReturnType<typeof render>['UNSAFE_root']) =>
        StyleSheet.flatten(root.findByType(TouchableOpacity).props.style).backgroundColor;

    it('a connected device gets the in-use fill', () => {
        const { UNSAFE_root } = render(<CapabilityTile {...buildTile({ connectState: 'connected' })} height={120} />);
        expect(fillOf(UNSAFE_root)).toBe(colors.tileActive);
    });

    it.each(['connecting', 'failed', undefined])('a device that is not connected (%s) does not look in use', (connectState) => {
        const { UNSAFE_root } = render(<CapabilityTile {...buildTile({ connectState: connectState as CapabilityDisplayProps['connectState'] })} height={120} />);
        expect(fillOf(UNSAFE_root)).toBe(colors.tileEmpty);
    });

    it('a switched-off tile keeps the muted fill even if its device reports connected', () => {
        const { UNSAFE_root } = render(<CapabilityTile {...buildTile({ connectState: 'connected', disabled: true, onUse: jest.fn() })} height={120} />);
        expect(fillOf(UNSAFE_root)).toBe(colors.tileEmpty);
    });
});

describe('CapabilityTile device name line', () => {

    const longName = 'DCSIM FTMS .100';

    it('the name stays on one line and is cut in the middle, so its distinguishing end stays visible', () => {
        const { getByText } = render(<CapabilityTile {...buildTile({ deviceName: longName, interface: 'wifi', connectState: 'failed' })} height={120} />);
        const name = getByText(longName);

        expect(name.props.numberOfLines).toBe(1);
        expect(name.props.ellipsizeMode).toBe('middle');
    });

    it('the name of a switched-off tile is cut the same way', () => {
        const { getByText } = render(<CapabilityTile {...buildTile({
            deviceName: longName, value: undefined, unit: undefined, onUnselect: undefined, disabled: true, emptyFooter: 'Not used', onUse: jest.fn(),
        })} height={120} />);
        const name = getByText(longName);

        expect(name.props.numberOfLines).toBe(1);
        expect(name.props.ellipsizeMode).toBe('middle');
    });

    it.each([[120, 12], [200, 14]])('at height %d the interface icon keeps a fixed %ddp box with a 4dp gap before the name', (height, iconSize) => {
        const { getByTestId } = render(<CapabilityTile {...buildTile({ deviceName: longName, interface: 'wifi', connectState: 'failed' })} height={height} />);
        const style = StyleSheet.flatten(getByTestId('capability-tile-interface-icon').props.style);

        expect(style.width).toBe(iconSize);
        expect(style.flexShrink).toBe(0);
        expect(style.marginRight).toBe(4);
    });
});

describe('CapabilityTile capability icon', () => {

    const iconSizeOf = (utils: ReturnType<typeof render>) => {
        const icon = utils.queryByTestId('capability-tile-icon');
        return icon ? icon.props.width : undefined;
    };

    it('shrinks or disappears when the tile also has to show a role line', () => {
        const plain = render(<CapabilityTile {...buildTile({ deviceName: 'Tacx Flux', connectState: 'failed', value: undefined, unit: undefined })} height={200} />);
        const withRole = render(<CapabilityTile {...buildTile({
            deviceName: 'Tacx Flux', connectState: 'failed', value: undefined, unit: undefined, trainerRole: 'via-trainer', roleLabel: 'via your trainer',
        })} height={200} />);

        const plainSize = iconSizeOf(plain);
        const roleSize = iconSizeOf(withRole);
        expect(plainSize).toBeGreaterThanOrEqual(24);
        if (roleSize !== undefined)
            expect(roleSize).toBeLessThan(plainSize);
    });

    it('is drawn square, at the size it was given, never below 24dp', () => {
        const utils = render(<CapabilityTile {...buildTile({ connectState: 'connected' })} height={200} />);
        const icon = utils.getByTestId('capability-tile-icon');

        expect(icon.props.width).toBe(icon.props.height);
        expect(icon.props.width).toBeGreaterThanOrEqual(24);
        expect(StyleSheet.flatten(icon.props.style).width).toBe(icon.props.width);
    });

    it('is left out on a tile too small to fit it', () => {
        const utils = render(<CapabilityTile {...buildTile({
            deviceName: 'Tacx Flux', connectState: 'failed', trainerRole: 'trainer', roleLabel: 'Your trainer', awaited: true,
        })} height={60} />);

        expect(utils.queryByTestId('capability-tile-icon')).toBeNull();
    });

    it('is centred in its row on a tile with no value, rather than sharing it with an empty value column', () => {
        const noValue = render(<CapabilityTile {...buildTile({ deviceName: 'Tacx Flux', connectState: 'failed', value: undefined, unit: undefined })} height={200} />);
        const withValue = render(<CapabilityTile {...buildTile({ connectState: 'connected' })} height={200} />);

        expect(noValue.getByTestId('capability-tile-icon-row').children).toHaveLength(1);
        expect(withValue.getByTestId('capability-tile-icon-row').children).toHaveLength(2);
    });

    it('the row the icon sits in clips anything that does not fit, so nothing is drawn over the lines around it', () => {
        const { getByTestId } = render(<CapabilityTile {...buildTile({ connectState: 'connected' })} height={200} />);

        expect(StyleSheet.flatten(getByTestId('capability-tile-icon-row').props.style).overflow).toBe('hidden');
    });
});

describe('CapabilityTile footer copy from the page service', () => {

    const footerText = { full: 'Not connected · waiting', short: 'Waiting…' };

    it('replaces the connect state, with the full copy on a tablet', () => {
        const { getByText, queryByText } = render(<CapabilityTile {...buildTile({ connectState: 'failed', footerText })} height={120} variant="full" />);
        expect(getByText('Not connected · waiting')).toBeTruthy();
        expect(queryByText('FAILED')).toBeNull();
    });

    it('replaces the connect state, with the phone copy on a phone', () => {
        const { getByText, queryByText } = render(<CapabilityTile {...buildTile({ connectState: 'failed', footerText })} height={120} variant="short" />);
        expect(getByText('Waiting…')).toBeTruthy();
        expect(queryByText('Not connected · waiting')).toBeNull();
    });

    it('replaces the state text of a found device', () => {
        const { getByText, queryByText } = render(<CapabilityTile {...buildTile({ connectState: 'connecting', stateText: 'Found', footerText })} height={120} variant="full" />);
        expect(getByText('Not connected · waiting')).toBeTruthy();
        expect(queryByText('FOUND')).toBeNull();
    });

    it("replaces an empty tile's footer", () => {
        const { getByText, queryByText } = render(<CapabilityTile {...buildTile({
            deviceName: undefined, value: undefined, unit: undefined, emptyFooter: 'Searching…',
            footerText: { full: 'Optional for now', short: 'Optional for now' },
        })} height={120} variant="short" />);
        expect(getByText('Optional for now')).toBeTruthy();
        expect(queryByText('Searching…')).toBeNull();
    });

    it("without it, a connecting device reads 'Connecting…', a connected one still 'CONNECTED'", () => {
        const connecting = render(<CapabilityTile {...buildTile({ title: 'Controller', capability: 'app_control', deviceName: 'Zwift Click B4EB', connectState: 'connecting' })} height={120} variant="short" />);
        expect(connecting.getByText('Connecting…')).toBeTruthy();
        expect(connecting.queryByText('CONNECTING')).toBeNull();

        const connected = render(<CapabilityTile {...buildTile({ title: 'Controller', capability: 'app_control', deviceName: 'Zwift Click B4EB', connectState: 'connected' })} height={120} variant="short" />);
        expect(connected.getByText('CONNECTED')).toBeTruthy();
    });

    it('without it, the tile keeps its own footer', () => {
        const connected = render(<CapabilityTile {...buildTile({ connectState: 'connected' })} height={120} />);
        expect(connected.getByText('CONNECTED')).toBeTruthy();

        const empty = render(<CapabilityTile {...buildTile({ deviceName: undefined, value: undefined, unit: undefined, emptyFooter: 'Searching…' })} height={120} />);
        expect(empty.getByText('Searching…')).toBeTruthy();
    });
});

describe('CapabilityTile trainer role line', () => {

    it("shows the role line on the trainer's own tile, above the device name", () => {
        const { getByText, toJSON } = render(<CapabilityTile {...buildTile({
            title: 'Resistance', capability: 'control', deviceName: 'Tacx Flux', connectState: 'failed',
            trainerRole: 'trainer', roleLabel: 'Your trainer',
        })} height={120} />);
        expect(getByText('Your trainer')).toBeTruthy();
        const tree = JSON.stringify(toJSON());
        expect(tree.indexOf('Your trainer')).toBeLessThan(tree.indexOf('Tacx Flux'));
    });

    it('shows the role line on a tile the trainer fills, below the device name', () => {
        const { getByText, toJSON } = render(<CapabilityTile {...buildTile({
            deviceName: 'Tacx Flux', connectState: 'failed', trainerRole: 'via-trainer', roleLabel: 'via your trainer',
        })} height={120} />);
        expect(getByText('via your trainer')).toBeTruthy();
        const tree = JSON.stringify(toJSON());
        expect(tree.indexOf('via your trainer')).toBeGreaterThan(tree.indexOf('Tacx Flux'));
    });

    it('shows no role line without one', () => {
        const { queryByText } = render(<CapabilityTile {...buildTile({ deviceName: 'Tacx Flux', connectState: 'failed' })} height={120} />);
        expect(queryByText('Your trainer')).toBeNull();
        expect(queryByText('via your trainer')).toBeNull();
    });
});
