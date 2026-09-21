import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { RoutesPage } from './RoutesPage';

const mockOnDownloadStop = jest.fn();
const mockOnDownloadRetry = jest.fn();
const mockOnDownloadDelete = jest.fn();
const mockOnDownloadKeepInstead = jest.fn();
const mockOnFilterChanged = jest.fn();
const mockOnFilterVisibleChange = jest.fn();
const mockOnImportClicked = jest.fn();
const mockOpenPage = jest.fn(() => ({ on: jest.fn(), stop: jest.fn() }));
const mockClosePage = jest.fn();
const mockGetPageDisplayProps = jest.fn(() => ({
    loading: false,
    synchronizing: false,
    routes: [],
    filters: {},
    filterOptions: { countries: [], contentTypes: [], routeTypes: [], routeSources: [] },
    filterVisible: false,
    detailRouteId: undefined,
}));

jest.mock('../../services', () => ({
    navigate: jest.fn(),
}));

jest.mock('incyclist-services', () => ({
    getRoutesPageService: () => ({
        openPage: mockOpenPage,
        closePage: mockClosePage,
        getPageDisplayProps: mockGetPageDisplayProps,
        onFilterChanged: mockOnFilterChanged,
        onFilterVisibleChange: mockOnFilterVisibleChange,
        onImportClicked: mockOnImportClicked,
        start: jest.fn(),
        onDownloadStop: mockOnDownloadStop,
        onDownloadRetry: mockOnDownloadRetry,
        onDownloadDelete: mockOnDownloadDelete,
        onDownloadKeepInstead: mockOnDownloadKeepInstead,
    }),
    useAppState: () => ({ getState: jest.fn(), setState: jest.fn() }),
    useWorkoutCalendar: () => ({
        getScheduledToday: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
    }),
}));

// A minimal stand-in for the real view that exposes the download handlers RoutesPage wires up,
// so this test can prove each one forwards to the correct page-service call - the real
// rendering/row logic is covered separately by RoutesPageView's and DownloadModalView's own
// tests.
jest.mock('./View', () => {
    const { TouchableOpacity, Text } = require('react-native');
    return {
        RoutesPageView: (props: any) => (
            <>
                <TouchableOpacity testID="stop" onPress={() => props.onDownloadStop('r1')}>
                    <Text>stop</Text>
                </TouchableOpacity>
                <TouchableOpacity testID="retry" onPress={() => props.onDownloadRetry('r2')}>
                    <Text>retry</Text>
                </TouchableOpacity>
                <TouchableOpacity testID="delete" onPress={() => props.onDownloadDelete('r3')}>
                    <Text>delete</Text>
                </TouchableOpacity>
                <TouchableOpacity testID="keep" onPress={() => props.onDownloadKeepInstead('r4')}>
                    <Text>keep</Text>
                </TouchableOpacity>
                {(props.routes ?? []).map((r: any) => (
                    <Text key={r.id} testID={`pill-${r.id}`}>{r.videoPill ?? 'none'}</Text>
                ))}
            </>
        ),
    };
});

jest.mock('../../components', () => ({
    ErrorBoundary: ({ children }: any) => children,
    MainBackground: () => null,
    RouteDetailsDialog: () => null,
    RouteImportDialog: () => null,
    ScheduledWorkoutPromptModal: () => null,
}));

describe('RoutesPage download handlers', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockOpenPage.mockReturnValue({ on: jest.fn(), stop: jest.fn() });
        mockGetPageDisplayProps.mockReturnValue({
            loading: false,
            synchronizing: false,
            routes: [],
            filters: {},
            filterOptions: { countries: [], contentTypes: [], routeTypes: [], routeSources: [] },
            filterVisible: false,
            detailRouteId: undefined,
        } as any);
    });

    it('forwards onDownloadStop to the page service', () => {
        const { getByTestId } = render(<RoutesPage />);
        fireEvent.press(getByTestId('stop'));
        expect(mockOnDownloadStop).toHaveBeenCalledWith('r1');
    });

    it('forwards onDownloadRetry to the page service', () => {
        const { getByTestId } = render(<RoutesPage />);
        fireEvent.press(getByTestId('retry'));
        expect(mockOnDownloadRetry).toHaveBeenCalledWith('r2');
    });

    it('forwards onDownloadDelete to the page service', () => {
        const { getByTestId } = render(<RoutesPage />);
        fireEvent.press(getByTestId('delete'));
        expect(mockOnDownloadDelete).toHaveBeenCalledWith('r3');
    });

    it('forwards onDownloadKeepInstead to the page service', () => {
        const { getByTestId } = render(<RoutesPage />);
        fireEvent.press(getByTestId('keep'));
        expect(mockOnDownloadKeepInstead).toHaveBeenCalledWith('r4');
    });
});

describe('RoutesPage video pill updates', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // A video pill (or a preview) can arrive asynchronously for a route that was already in the
    // list - same id, same position, just a changed display prop. The routes array reference is
    // deliberately stabilized across page-update events to avoid needless re-renders, but that
    // stabilization must not swallow this case: an id-only hash would never see the change.
    it('reflects a pill that appears on an existing route after a later page-update', () => {
        let pageUpdateHandler: (() => void) | undefined;
        mockOpenPage.mockReturnValue({
            on: jest.fn((event: string, cb: () => void) => {
                if (event === 'page-update')
                    pageUpdateHandler = cb;
            }),
            stop: jest.fn(),
        });

        const displayProps = (videoPill?: string) => ({
            loading: false,
            synchronizing: false,
            routes: [{ id: 'r1', videoPill }],
            filters: {},
            filterOptions: { countries: [], contentTypes: [], routeTypes: [], routeSources: [] },
            filterVisible: false,
            detailRouteId: undefined,
        } as any);

        mockGetPageDisplayProps.mockReturnValue(displayProps(undefined));

        const { getByTestId } = render(<RoutesPage />);
        expect(getByTestId('pill-r1').props.children).toBe('none');

        // the availability query resolves later and the page service emits page-update again -
        // same route id, now with a pill
        mockGetPageDisplayProps.mockReturnValue(displayProps('in-icloud'));
        act(() => { pageUpdateHandler?.(); });

        expect(getByTestId('pill-r1').props.children).toBe('in-icloud');
    });
});
