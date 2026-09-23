import React from 'react';
import { render, fireEvent, act, within } from '@testing-library/react-native';
import { TextInput, StyleSheet } from 'react-native';
import { FilterPanel } from './FilterPanel';
import type { FilterPanelProps } from './types';

// Mock incyclist-services
jest.mock('incyclist-services', () => ({
    FormattedNumber: jest.fn(),
}));

// Mock custom hooks - Dialog (rendered by the compact/phone layout) also pulls in
// useUnmountEffect and useScreenLayout, so both need a value here even though FilterPanel
// itself only uses useLogging. Shared mockLogEvent (rather than a fresh jest.fn() per call) so
// tests can assert on it.
const mockLogEvent = jest.fn();
jest.mock('../../hooks', () => ({
    useLogging: () => ({
        logEvent: mockLogEvent,
    }),
    useUnmountEffect: jest.fn(),
    useScreenLayout: () => 'compact',
}));

// Mock Icon component
jest.mock('../Icon', () => ({
    Icon: () => null,
}));

// Mock useWindowDimensions to simulate a specific height
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
    default: jest.fn().mockReturnValue({ height: 400, width: 800 }),
}));

const MOCK_OPTIONS = {
    countries: ['Belgium', 'Germany'],
    contentTypes: ['Video', 'GPX'],
    routeTypes: ['Loop', 'Point to Point'],
    routeSources: ['Local', 'Online'],
    maxDistance: { value: 200, unit: 'km' },
    maxElevation: { value: 3000, unit: 'm' },
} as unknown as FilterPanelProps['options'];

const MOCK_PROPS = {
    filters: {},
    visible: true,
    compact: false,
    options: MOCK_OPTIONS,
    onFilterChanged: jest.fn(),
    onToggle: jest.fn(),
};

const advanceDebounce = () => act(() => {
    jest.advanceTimersByTime(300);
});

describe('FilterPanel', () => {
    it('renders normal (tablet) layout when visible', () => {
        const { getByPlaceholderText } = render(<FilterPanel {...MOCK_PROPS} />);
        expect(getByPlaceholderText('Search title...')).toBeTruthy();
    });

    // Regression: FilterInput (Dist/Elev, shared with the phone dialog) wraps its TextInput in a
    // View whose own `flex: 1` is what makes it fill its row - a version of this component once
    // wrapped the TextInput in an extra `flexDirection: 'row'` container (for a commit button that
    // has since been removed) without giving the TextInput itself a matching flex, and on native
    // RN a row child with no flex shrinks to its content size. Confirmed on a real tablet device,
    // where Dist/Elev collapsed to a several-px-wide sliver - a browser-rendered Storybook check
    // didn't catch it (HTML's <input> has its own built-in default width). This reads the actual
    // resolved style of the input's immediate wrapper rather than relying on a screenshot.
    it('gives the Dist/Elev inputs a flex:1 wrapper on tablet, so they fill their row', () => {
        const { UNSAFE_root } = render(<FilterPanel {...MOCK_PROPS} />);
        // Title isn't part of this shared component on tablet, so it's excluded - only the
        // Dist/Elev min/max fields (the ones with no placeholder) are at risk.
        const distElevInputs = UNSAFE_root.findAllByType(TextInput).filter((input) => !input.props.placeholder);
        expect(distElevInputs.length).toBe(4);
        distElevInputs.forEach((input) => {
            const flat = StyleSheet.flatten(input.parent!.props.style);
            expect(flat.flex).toBe(1);
        });
    });

    it('hides normal (tablet) layout when not visible', () => {
        const { queryByPlaceholderText } = render(<FilterPanel {...MOCK_PROPS} visible={false} />);
        expect(queryByPlaceholderText('Search title...')).toBeNull();
    });

    // Regression: filterOptions can still be undefined right after navigating
    // to the page (data not loaded yet). The non-compact dropdown lists
    // render inside a Modal, whose children mount on every render regardless
    // of `visible` — so `options` being undefined here must not crash, even
    // though no dropdown is open.
    it('does not crash when options is undefined (non-compact)', () => {
        const props = { ...MOCK_PROPS, options: undefined as unknown as FilterPanelProps['options'] };
        expect(() => render(<FilterPanel {...props} />)).not.toThrow();
    });

    it('does not crash when options is undefined (compact)', () => {
        const props = { ...MOCK_PROPS, compact: true, options: undefined as unknown as FilterPanelProps['options'] };
        expect(() => render(<FilterPanel {...props} />)).not.toThrow();
    });

    describe('phone dialog (compact)', () => {
        const COMPACT_PROPS = { ...MOCK_PROPS, compact: true, resultCount: 23 };

        beforeEach(() => {
            mockLogEvent.mockClear();
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('opens a full-screen dialog with every filter field, instead of an inline expanding panel', () => {
            const { getByPlaceholderText, getByText } = render(<FilterPanel {...COMPACT_PROPS} />);
            expect(getByPlaceholderText('Search title...')).toBeTruthy();
            expect(getByText('Filters')).toBeTruthy();
            expect(getByText('Content')).toBeTruthy();
            expect(getByText('Type')).toBeTruthy();
            expect(getByText('Source')).toBeTruthy();
            expect(getByText('Country')).toBeTruthy();
        });

        it('hides the dialog content when not visible', () => {
            const { queryByPlaceholderText } = render(<FilterPanel {...COMPACT_PROPS} visible={false} />);
            expect(queryByPlaceholderText('Search title...')).toBeNull();
        });

        it('shows the live result count on the footer button', () => {
            const { getByText } = render(<FilterPanel {...COMPACT_PROPS} resultCount={7} />);
            expect(getByText('Show 7 routes')).toBeTruthy();
        });

        it('singularizes the footer button label for exactly one result', () => {
            const { getByText } = render(<FilterPanel {...COMPACT_PROPS} resultCount={1} />);
            expect(getByText('Show 1 route')).toBeTruthy();
        });

        // No commit button any more (removed after a UX consult found it was the only such
        // control in the app) - typing applies live, debounced, since a full-screen dialog has no
        // list visible behind it for an in-flight value to look wrong against.
        it('applies a title filter live, debounced, with no commit button', () => {
            const onFilterChanged = jest.fn();
            const { getByPlaceholderText, queryByLabelText } = render(
                <FilterPanel {...COMPACT_PROPS} onFilterChanged={onFilterChanged} />
            );
            expect(queryByLabelText('Apply title filter')).toBeNull();
            fireEvent.changeText(getByPlaceholderText('Search title...'), 'Dolomites');
            expect(onFilterChanged).not.toHaveBeenCalled();
            advanceDebounce();
            expect(onFilterChanged).toHaveBeenCalledWith(expect.objectContaining({ title: 'Dolomites' }));
        });

        it('flushes a pending title debounce immediately on blur, without waiting', () => {
            const onFilterChanged = jest.fn();
            const { getByPlaceholderText } = render(<FilterPanel {...COMPACT_PROPS} onFilterChanged={onFilterChanged} />);
            const input = getByPlaceholderText('Search title...');
            fireEvent.changeText(input, 'Dolomites');
            fireEvent(input, 'blur');
            expect(onFilterChanged).toHaveBeenCalledWith(expect.objectContaining({ title: 'Dolomites' }));
        });

        it('silently clamps an out-of-range numeric value to max, with no error text', () => {
            const onFilterChanged = jest.fn();
            const { getByTestId, queryByText } = render(
                <FilterPanel {...COMPACT_PROPS} onFilterChanged={onFilterChanged} />
            );
            fireEvent.changeText(getByTestId('distance_min'), '5000');
            advanceDebounce();
            expect(onFilterChanged).toHaveBeenCalledWith(
                expect.objectContaining({ distance: { min: { value: 200, unit: 'km' } } })
            );
            expect(queryByText(/Max/)).toBeNull();
        });

        it('selects a content-type filter via chips, with an "All" chip that clears it', () => {
            const onFilterChanged = jest.fn();
            const { getByText } = render(<FilterPanel {...COMPACT_PROPS} onFilterChanged={onFilterChanged} />);
            fireEvent.press(getByText('Video'));
            expect(onFilterChanged).toHaveBeenCalledWith(expect.objectContaining({ contentType: 'Video' }));
        });

        it('clears every filter via the "Clear all" footer button', () => {
            const onFilterChanged = jest.fn();
            const props = { ...COMPACT_PROPS, filters: { title: 'Alps', contentType: 'Video' }, onFilterChanged };
            const { getByText } = render(<FilterPanel {...props} />);
            fireEvent.press(getByText('Clear all'));
            expect(onFilterChanged).toHaveBeenCalledWith({});
        });

        it('closes the dialog via the "Show N routes" footer button', () => {
            const onToggle = jest.fn();
            const { getByText } = render(<FilterPanel {...COMPACT_PROPS} onToggle={onToggle} />);
            fireEvent.press(getByText('Show 23 routes'));
            expect(onToggle).toHaveBeenCalled();
        });

        it('shows a badge with the active-filter count on the funnel trigger', () => {
            const { getByText, getByPlaceholderText } = render(<FilterPanel {...COMPACT_PROPS} />);
            fireEvent.changeText(getByPlaceholderText('Search title...'), 'Alps');
            advanceDebounce();
            fireEvent.press(getByText('Video'));
            expect(getByText('2')).toBeTruthy();
        });

        it('shows no badge when there are no active filters', () => {
            const { queryByText } = render(<FilterPanel {...COMPACT_PROPS} filters={{}} />);
            expect(queryByText('0')).toBeNull();
        });

        it('does not crash with many countries', () => {
            const manyCountries = Array.from({ length: 30 }, (_, i) => `Country ${i}`);
            const props = {
                ...COMPACT_PROPS,
                options: { ...MOCK_OPTIONS, countries: manyCountries } as unknown as FilterPanelProps['options'],
            };
            expect(() => render(<FilterPanel {...props} />)).not.toThrow();
        });

        // Regression: Country's option list used to expand in flow directly below its trigger,
        // inside the dialog's own body. With a long list in a short dialog, that read as a stray
        // "All" floating below the trigger with no indication anything else was reachable - and
        // when it briefly used a nested ScrollView to bound itself, that ScrollView fought the
        // dialog's own ScrollView for the scroll gesture on Android, so only the first row ever
        // showed. Country now opens its own full-screen picker dialog instead (the same nested-
        // Dialog-inside-a-full-Dialog pattern RouteDetailsView already ships): the list gets its
        // own screen and its own single scroll region, with no competition for space or gesture.
        it('opens Country as its own full-screen picker dialog, not an inline list', () => {
            const manyCountries = Array.from({ length: 30 }, (_, i) => `Country ${i}`);
            const props = {
                ...COMPACT_PROPS,
                options: { ...MOCK_OPTIONS, countries: manyCountries } as unknown as FilterPanelProps['options'],
            };
            const { getByTestId, getByText, queryByText } = render(<FilterPanel {...props} />);
            expect(queryByText('All countries')).toBeNull();
            fireEvent.press(getByTestId('country-select-trigger'));
            expect(getByText('All countries')).toBeTruthy();
            expect(getByText('Country 29')).toBeTruthy();
        });

        it('applies the selected country and closes the picker', () => {
            const onFilterChanged = jest.fn();
            const { getByTestId, getByText, queryByText } = render(
                <FilterPanel {...COMPACT_PROPS} onFilterChanged={onFilterChanged} />
            );
            fireEvent.press(getByTestId('country-select-trigger'));
            fireEvent.press(getByText('Belgium'));
            expect(onFilterChanged).toHaveBeenCalledWith(expect.objectContaining({ country: 'Belgium' }));
            // Dialog's own close is animated (220ms) before it unmounts its content.
            advanceDebounce();
            expect(queryByText('All countries')).toBeNull();
        });

        // Regression: picking a country from the full-screen picker didn't log an 'option
        // selected' event, unlike every other select-style field in this dialog (FilterSelect's
        // Modal branch on tablet, and ChipSelect for Content/Type/Source both log on selection).
        it('logs an "option selected" event when a country is picked', () => {
            const { getByTestId, getByText } = render(<FilterPanel {...COMPACT_PROPS} />);
            fireEvent.press(getByTestId('country-select-trigger'));
            fireEvent.press(getByText('Belgium'));
            expect(mockLogEvent).toHaveBeenCalledWith(expect.objectContaining({
                message: 'option selected',
                field: 'country',
                value: 'Belgium',
                eventSource: 'user',
            }));
        });

        it('clears the country filter via "All countries"', () => {
            const onFilterChanged = jest.fn();
            const props = { ...COMPACT_PROPS, filters: { country: 'Belgium' }, onFilterChanged };
            const { getByTestId, getByText } = render(<FilterPanel {...props} />);
            fireEvent.press(getByTestId('country-select-trigger'));
            fireEvent.press(getByText('All countries'));
            expect(onFilterChanged).toHaveBeenCalledWith(expect.objectContaining({ country: undefined }));
        });

        // Regression: on a fresh mount (e.g. navigating away from the Routes page and back),
        // `localFilters` used to initialize to `{}` - a truthy value - which made the mount-sync
        // effect's `if (localFilters) return` guard fire immediately and never copy the incoming
        // `filters` prop into local state. The route list itself stayed correctly filtered
        // (RouteListService persists the filter in a singleton), but the trigger fell back to
        // displaying "All" regardless of what was actually applied.
        it('shows the already-applied country on a fresh mount, not "All"', () => {
            const props = { ...COMPACT_PROPS, filters: { country: 'Belgium' } };
            const { getByTestId } = render(<FilterPanel {...props} />);
            expect(within(getByTestId('country-select-trigger')).getByText('Belgium')).toBeTruthy();
            expect(within(getByTestId('country-select-trigger')).queryByText('All')).toBeNull();
        });

        it('closes the Country picker via its Cancel button without applying anything', () => {
            const onFilterChanged = jest.fn();
            const { getByTestId, getByText, queryByText } = render(
                <FilterPanel {...COMPACT_PROPS} onFilterChanged={onFilterChanged} />
            );
            fireEvent.press(getByTestId('country-select-trigger'));
            fireEvent.press(getByText('Cancel'));
            expect(onFilterChanged).not.toHaveBeenCalled();
            // Dialog's own close is animated (220ms) before it unmounts its content.
            advanceDebounce();
            expect(queryByText('All countries')).toBeNull();
        });

        // Regression guard for the same class of defect as the tablet test above - Title is the
        // one field that sits directly in a row (`inlineFieldRow`, label + input) rather than
        // behind an extra wrapper, so it needs `flex:1` on the TextInput itself.
        it('gives the Title input flex:1 directly, since it sits directly in the label row', () => {
            const { getByPlaceholderText } = render(<FilterPanel {...COMPACT_PROPS} />);
            const flat = StyleSheet.flatten(getByPlaceholderText('Search title...').props.style);
            expect(flat.flex).toBe(1);
        });

        it('gives the Dist/Elev inputs a flex:1 wrapper, same as tablet', () => {
            const { UNSAFE_root } = render(<FilterPanel {...COMPACT_PROPS} />);
            const distElevInputs = UNSAFE_root.findAllByType(TextInput).filter((input) => !input.props.placeholder);
            expect(distElevInputs.length).toBe(4);
            distElevInputs.forEach((input) => {
                const flat = StyleSheet.flatten(input.parent!.props.style);
                expect(flat.flex).toBe(1);
            });
        });
    });
});
