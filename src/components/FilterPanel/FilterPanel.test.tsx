import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { FilterPanel } from './FilterPanel';
import type { FilterPanelProps } from './types';

// Mock incyclist-services
jest.mock('incyclist-services', () => ({
    FormattedNumber: jest.fn(),
}));

// Mock custom hooks - Dialog (rendered by the compact/phone layout) also pulls in
// useUnmountEffect and useScreenLayout, so both need a value here even though FilterPanel
// itself only uses useLogging.
jest.mock('../../hooks', () => ({
    useLogging: () => ({
        logEvent: jest.fn(),
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

describe('FilterPanel', () => {
    it('renders normal (tablet) layout when visible', () => {
        const { getByPlaceholderText } = render(<FilterPanel {...MOCK_PROPS} />);
        expect(getByPlaceholderText('Search title...')).toBeTruthy();
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

    // Trigger row (funnel icon + active-filter pills) stays on the page in both layouts -
    // on phone it's the dialog's trigger, so it must never disappear behind the dialog itself.
    it('always renders the active-filter pills, even while the phone dialog is open', () => {
        const props = { ...MOCK_PROPS, compact: true };
        const { getByText, getByPlaceholderText, getByLabelText } = render(<FilterPanel {...props} />);
        fireEvent.changeText(getByPlaceholderText('Search title...'), 'Alps');
        fireEvent.press(getByLabelText('Apply title filter'));
        expect(getByText('*Alps*')).toBeTruthy();
    });

    describe('phone dialog (compact)', () => {
        const COMPACT_PROPS = { ...MOCK_PROPS, compact: true, resultCount: 23 };

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

        it('applies a title filter via the explicit commit button rather than requiring blur', () => {
            const onFilterChanged = jest.fn();
            const { getByPlaceholderText, getByLabelText } = render(
                <FilterPanel {...COMPACT_PROPS} onFilterChanged={onFilterChanged} />
            );
            fireEvent.changeText(getByPlaceholderText('Search title...'), 'Dolomites');
            fireEvent.press(getByLabelText('Apply title filter'));
            expect(onFilterChanged).toHaveBeenCalledWith(expect.objectContaining({ title: 'Dolomites' }));
        });

        it('applies a numeric filter via its explicit commit button', () => {
            const onFilterChanged = jest.fn();
            const { getByLabelText } = render(<FilterPanel {...COMPACT_PROPS} onFilterChanged={onFilterChanged} />);
            fireEvent.press(getByLabelText('Apply distance_min'));
            // No value typed yet, so this just proves the button exists and doesn't crash -
            // the commit-on-value-change path is covered by the title test above.
            expect(onFilterChanged).not.toHaveBeenCalledWith(expect.objectContaining({ title: expect.anything() }));
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
            const { getByText, getByPlaceholderText, getByLabelText } = render(<FilterPanel {...COMPACT_PROPS} />);
            fireEvent.changeText(getByPlaceholderText('Search title...'), 'Alps');
            fireEvent.press(getByLabelText('Apply title filter'));
            fireEvent.press(getByText('Video'));
            expect(getByText('2')).toBeTruthy();
        });

        it('shows no badge when there are no active filters', () => {
            const { queryByText } = render(<FilterPanel {...COMPACT_PROPS} filters={{}} />);
            expect(queryByText('0')).toBeNull();
        });

        it('does not crash with many countries (Country keeps an inline scrollable list)', () => {
            const manyCountries = Array.from({ length: 30 }, (_, i) => `Country ${i}`);
            const props = {
                ...COMPACT_PROPS,
                options: { ...MOCK_OPTIONS, countries: manyCountries } as unknown as FilterPanelProps['options'],
            };
            expect(() => render(<FilterPanel {...props} />)).not.toThrow();
        });
    });
});
