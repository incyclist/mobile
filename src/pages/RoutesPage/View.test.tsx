import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { RoutesPageView } from './View';

jest.mock('../../components', () => {
    const React = require('react');
    const { Text } = require('react-native');
    return {
        NavigationBar: () => null,
        MainBackground: ({ children }: any) => children,
        RoutesTable: () => null,
        FilterPanel: () => null,
        Icon: () => null,
        DownloadModalView: ({ visible }: any) => visible ? <Text>DOWNLOADS_MODAL</Text> : null,
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
    it('renders without crashing in normal layout', () => {
        render(<RoutesPageView {...BASE_PROPS} />);
    });

    it('renders without crashing in compact layout', () => {
        render(<RoutesPageView {...BASE_PROPS} compact={true} />);
    });

    it('renders download pill when activeDownloadCount > 0', () => {
        const { getByText } = render(<RoutesPageView {...BASE_PROPS} activeDownloadCount={3} />);
        expect(getByText('↓ 3')).toBeTruthy();
    });

    it('does not render download pill when activeDownloadCount is 0', () => {
        const { queryByText } = render(<RoutesPageView {...BASE_PROPS} activeDownloadCount={0} />);
        expect(queryByText(/↓/)).toBeNull();
    });

    it('calls onDownloadPillPress when pill is pressed', () => {
        const onDownloadPillPress = jest.fn();
        const { getByText } = render(
            <RoutesPageView 
                {...BASE_PROPS} 
                activeDownloadCount={1} 
                onDownloadPillPress={onDownloadPillPress} 
            />
        );
        fireEvent.press(getByText('↓ 1'));
        expect(onDownloadPillPress).toHaveBeenCalled();
    });

    it('renders DownloadModalView when showDownloadModal is true', () => {
        const { getByText } = render(<RoutesPageView {...BASE_PROPS} showDownloadModal={true} />);
        expect(getByText('DOWNLOADS_MODAL')).toBeTruthy();
    });
});