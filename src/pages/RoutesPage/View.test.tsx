import React from 'react';
import { render } from '@testing-library/react-native';
import { RoutesPageView } from './View';

jest.mock('../../components', () => ({
    NavigationBar: () => null,
    MainBackground: ({ children }: any) => children,
    RoutesTable: () => null,
    FilterPanel: () => null,
    Icon: () => null,
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
    activeDownloadCount: 0,
    downloadRows: [],
    showDownloadModal: false,
    onDownloadPillPress: jest.fn(),
    onDownloadModalClose: jest.fn(),
    onDownloadStop: jest.fn(),
    onDownloadRetry: jest.fn(),
    onDownloadDelete: jest.fn(),
};

describe('RoutesPageView', () => {
    it('renders correctly in normal layout', () => {
        const { toJSON } = render(<RoutesPageView {...BASE_PROPS} />);
        expect(toJSON()).toMatchSnapshot();
    });

    it('renders correctly in compact layout', () => {
        const { toJSON } = render(<RoutesPageView {...BASE_PROPS} compact={true} />);
        expect(toJSON()).toMatchSnapshot();
    });

    it('renders download pill when activeDownloadCount > 0', () => {
        const { getByText } = render(<RoutesPageView {...BASE_PROPS} activeDownloadCount={3} />);
        expect(getByText('↓ 3')).toBeTruthy();
    });

    it('does not render download pill when activeDownloadCount is 0', () => {
        const { queryByText } = render(<RoutesPageView {...BASE_PROPS} activeDownloadCount={0} />);
        expect(queryByText(/↓/)).toBeNull();
    });
});