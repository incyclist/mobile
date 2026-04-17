import React from 'react';
import { render } from '@testing-library/react-native';
import { RoutesPageView } from './View';
import { IObserver } from 'incyclist-services';

jest.mock('../../components', () => ({
    NavigationBar: () => null,
    MainBackground: ({ children }: any) => children,
    RoutesTable: () => null,
    FilterPanel: () => null,
    Icon: () => null,
    DownloadModalView: () => null,
    DownloadPill: () => null,
    Dynamic: ({ children }: any) => children,
}));

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
    downloadObserver: { 
        on: jest.fn(), 
        off: jest.fn(), 
        stop: jest.fn(), 
        emit: jest.fn(), 
        once: jest.fn() 
    } as unknown as IObserver,
};

describe('RoutesPageView', () => {
    it('renders correctly in normal layout', () => {
        render(<RoutesPageView {...BASE_PROPS} />);
    });

    it('renders correctly in compact layout', () => {
        render(<RoutesPageView {...BASE_PROPS} compact={true} />);
    });
});