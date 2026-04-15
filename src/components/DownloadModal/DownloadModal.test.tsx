import React from 'react';
import { render } from '@testing-library/react-native';
import { DownloadModal } from './DownloadModal';
import { useRouteList } from 'incyclist-services';

jest.mock('incyclist-services', () => ({
    useRouteList: jest.fn(),
}));

describe('DownloadModal', () => {
    const mockService = {
        getAllRoutes: jest.fn().mockReturnValue([]),
        getCard: jest.fn().mockReturnValue(null),
    };

    beforeEach(() => {
        (useRouteList as jest.Mock).mockReturnValue(mockService);
    });

    it('renders nothing when visible=false', () => {
        const { toJSON } = render(<DownloadModal visible={false} onClose={jest.fn()} />);
        expect(toJSON()).toBeNull();
    });

    it('renders empty state when rows=[]', () => {
        mockService.getAllRoutes.mockReturnValue([]);
        render(<DownloadModal visible={true} onClose={jest.fn()} />);
    });

    it('renders all three status variants without crashing', () => {
        const createMockCard = (id: string, title: string, status: string) => ({
            getId: () => id,
            getData: () => ({ description: { title, id } }),
            getCurrentDownload: () => ({ status, progress: 50, speed: '1MB/s', sizeLabel: '1/2GB' }),
            cardObserver: { on: jest.fn(), off: jest.fn() },
            stopDownload: jest.fn(),
            download: jest.fn(),
            delete: jest.fn(),
        });

        const cards = [
            createMockCard('r1', 'Route 1', 'downloading'),
            createMockCard('r2', 'Route 2', 'done'),
            createMockCard('r3', 'Route 3', 'failed'),
            createMockCard('r4', 'Route 4', 'required'),
        ];

        mockService.getAllRoutes.mockReturnValue(cards.map(c => c.getData()));
        mockService.getCard.mockImplementation((id: string) => cards.find(c => c.getId() === id));

        render(<DownloadModal visible={true} onClose={jest.fn()} />);
    });
});