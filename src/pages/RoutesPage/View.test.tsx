import React from 'react';
import { render, act } from '@testing-library/react-native';
import { RoutesPageView } from './View';
import { IObserver } from 'incyclist-services';

const mockDownloadModalView = jest.fn((_props: any) => null);
const mockExplainer = jest.fn((_props: any) => null);

jest.mock('../../components', () => {
    const { View, Text } = require('react-native');
    return {
        NavigationBar: () => null,
        MainBackground: ({ children }: any) => children,
        RoutesTable: () => null,
        FilterPanel: () => null,
        Icon: () => null,
        DownloadModalView: (props: any) => mockDownloadModalView(props),
        DownloadPill: () => null,
        RouteSourceExplainer: (props: any) => mockExplainer(props),
        Dynamic: ({ children }: any) => children,
        ListPageShell: ({ title, headerLeft, headerRight, belowHeader, children }: any) => (
            <View>
                <Text>{title}</Text>
                {headerLeft}
                {headerRight}
                {belowHeader}
                {children}
            </View>
        ),
    };
});

const BASE_PROPS: any = {
    loading: false,
    synchronizing: false,
    routes: [],
    filters: {},
    filterOptions: { countries: [], contentTypes: [], routeTypes: [], routeSources: [] },
    filterVisible: false,
    compact: false,
    showImportDialog: false,
    onFilterToggle: jest.fn(),
    onNavigate: jest.fn(),
    onImportClicked: jest.fn(),
    onFilterChanged: jest.fn(),
    onImportClose: jest.fn(),
    showDownloadModal: false,
    onDownloadPillPress: jest.fn(),
    onDownloadModalClose: jest.fn(),
    onDownloadStop: jest.fn(),
    onDownloadRetry: jest.fn(),
    onDownloadDelete: jest.fn(),
    onDownloadKeepInstead: jest.fn(),
    downloadObserver: {
        on: jest.fn(), 
        off: jest.fn(), 
        stop: jest.fn(), 
        emit: jest.fn(), 
        once: jest.fn() 
    } as unknown as IObserver,
};

describe('RoutesPageView', () => {
    beforeEach(() => {
        mockDownloadModalView.mockClear();
        mockExplainer.mockClear();
    });

    it('renders correctly in normal layout', () => {
        render(<RoutesPageView {...BASE_PROPS} />);
    });

    it('forwards compact and onDownloadKeepInstead to DownloadModalView', () => {
        render(<RoutesPageView {...BASE_PROPS} compact onDownloadKeepInstead={BASE_PROPS.onDownloadKeepInstead} />);
        expect(mockDownloadModalView).toHaveBeenCalledWith(
            expect.objectContaining({ compact: true, onKeepInstead: BASE_PROPS.onDownloadKeepInstead })
        );
    });

    it('renders correctly in compact layout', () => {
        render(<RoutesPageView {...BASE_PROPS} compact={true} />);
    });

    it('renders import button with correct label', () => {
        const { getByText } = render(<RoutesPageView {...BASE_PROPS} />);
        expect(getByText('Import Routes')).toBeTruthy();
    });

    describe('explainer for routes that need an unreachable computer', () => {
        const unavailable = (id: string, sourceLabel = 'Den PC') => ({
            id, availability: 'unavailable', unavailableReason: 'linkUnreachable', sourceLabel,
        });

        it('names the computer that the greyed-out routes need', () => {
            render(<RoutesPageView {...BASE_PROPS} routes={[{ id: 'a', availability: 'local' }, unavailable('b'), unavailable('c')]} />);
            expect(mockExplainer).toHaveBeenCalledWith(expect.objectContaining({ computerNames: ['Den PC'] }));
        });

        it('passes every computer that is needed', () => {
            render(<RoutesPageView {...BASE_PROPS} routes={[unavailable('b'), unavailable('c', 'Studio Mac')]} />);
            expect(mockExplainer).toHaveBeenCalledWith(expect.objectContaining({ computerNames: ['Den PC', 'Studio Mac'] }));
        });

        it('has nothing to explain while every route can be started', () => {
            render(<RoutesPageView {...BASE_PROPS} routes={[{ id: 'a', availability: 'fromLink', sourceLabel: 'Den PC' }]} />);
            expect(mockExplainer).toHaveBeenCalledWith(expect.objectContaining({ computerNames: [] }));
        });

        it('is not shown on a phone that is shorter than 360', () => {
            const dims = jest.spyOn(require('react-native'), 'useWindowDimensions').mockReturnValue({ width: 568, height: 320, scale: 1, fontScale: 1 });
            render(<RoutesPageView {...BASE_PROPS} compact routes={[unavailable('b')]} />);
            expect(mockExplainer).not.toHaveBeenCalled();
            dims.mockRestore();
        });

        it('stays away once it was dismissed', () => {
            render(<RoutesPageView {...BASE_PROPS} routes={[unavailable('b')]} />);
            act(() => mockExplainer.mock.calls.at(-1)?.[0].onDismiss());
            mockExplainer.mockClear();

            render(<RoutesPageView {...BASE_PROPS} routes={[unavailable('b')]} />);
            expect(mockExplainer).not.toHaveBeenCalled();
        });
    });
});
