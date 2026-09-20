import React from 'react';
import { render } from '@testing-library/react-native';
import { RoutesPageView } from './View';
import { IObserver } from 'incyclist-services';

const mockDownloadModalView = jest.fn((_props: any) => null);

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
});