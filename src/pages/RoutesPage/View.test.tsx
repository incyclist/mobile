import React from 'react';
import { render } from '@testing-library/react-native';
import { RoutesPageView } from './View';

jest.mock('../../components', () => ({
    NavigationBar: () => null,
    MainBackground: ({ children }: any) => children,
    RoutesTable: () => null,
    FilterPanel: () => null,
}));

const MOCK_PROPS: any = {
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
};

describe('RoutesPageView', () => {
    it('renders correctly in normal layout', () => {
        const { toJSON } = render(<RoutesPageView {...MOCK_PROPS} compact={false} />);
        expect(toJSON()).toMatchSnapshot();
    });

    it('renders correctly in compact layout', () => {
        const { toJSON } = render(<RoutesPageView {...MOCK_PROPS} compact={true} />);
        expect(toJSON()).toMatchSnapshot();
    });
});