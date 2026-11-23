import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { RouteItemView } from './RouteItemView';
import {
    ROUTE_ITEM_IN_ICLOUD, ROUTE_ITEM_DOWNLOADING, ROUTE_ITEM_NO_PILL, ROUTE_ITEM_FROM_LINK, ROUTE_ITEM_UNAVAILABLE,
    ROUTE_ITEM_LOCAL_COPY,
} from './RouteItem.mock';

// RouteItemView renders SecureImage, which pulls in the fs binding and a native TurboModule -
// not under test here, and not available in the Jest environment. Stub it out.
const mockSecureImage = jest.fn();
jest.mock('../SecureImage', () => ({
    SecureImage: (props: any) => {
        mockSecureImage(props);
        return null;
    },
}));

const HANDLERS = {
    onSelect: jest.fn(),
    onDelete: jest.fn(),
};

describe('RouteItemView video pill', () => {
    it('shows "In iCloud" for a route whose video is not downloaded', () => {
        const { getByText, queryByText } = render(<RouteItemView {...ROUTE_ITEM_IN_ICLOUD} {...HANDLERS} />);
        expect(getByText('In iCloud')).toBeTruthy();
        expect(queryByText('Downloading')).toBeNull();
    });

    it('shows "Downloading" for a route whose video is downloading', () => {
        const { getByText, queryByText } = render(<RouteItemView {...ROUTE_ITEM_DOWNLOADING} {...HANDLERS} />);
        expect(getByText('Downloading')).toBeTruthy();
        expect(queryByText('In iCloud')).toBeNull();
    });

    it('shows no video pill when videoPill is absent (server route, local file, or a platform without the binding)', () => {
        const { queryByText } = render(<RouteItemView {...ROUTE_ITEM_NO_PILL} {...HANDLERS} />);
        expect(queryByText('In iCloud')).toBeNull();
        expect(queryByText('Downloading')).toBeNull();
    });

    it('can show the video pill together with the New badge', () => {
        const { getByText } = render(
            <RouteItemView {...ROUTE_ITEM_IN_ICLOUD} isNew {...HANDLERS} />
        );
        expect(getByText('In iCloud')).toBeTruthy();
        expect(getByText('New')).toBeTruthy();
    });
});

describe('RouteItemView route source', () => {
    it('shows the computer a route plays from', () => {
        const { getByText } = render(<RouteItemView {...ROUTE_ITEM_FROM_LINK} {...HANDLERS} />);
        expect(getByText(/• Den PC/)).toBeTruthy();
    });

    it('says which computer a route that can not be started needs', () => {
        const { getByText } = render(<RouteItemView {...ROUTE_ITEM_UNAVAILABLE} {...HANDLERS} />);
        expect(getByText(/• Needs Den PC/)).toBeTruthy();
    });

    it('adds nothing for a route that is on this device', () => {
        const { queryByText } = render(<RouteItemView {...ROUTE_ITEM_NO_PILL} {...HANDLERS} />);
        expect(queryByText(/•.*Den PC/)).toBeNull();
    });

    it('a route that can not be started stays selectable, to learn why', () => {
        const onSelect = jest.fn();
        const { getByText } = render(<RouteItemView {...ROUTE_ITEM_UNAVAILABLE} {...HANDLERS} onSelect={onSelect} />);
        fireEvent.press(getByText('Mont Ventoux'));
        expect(onSelect).toHaveBeenCalledWith('route-unavailable');
    });

    it('asks the thumbnail cache for the thumbnail of the computer', () => {
        mockSecureImage.mockClear();
        render(<RouteItemView {...ROUTE_ITEM_UNAVAILABLE} {...HANDLERS} />);
        expect(mockSecureImage).toHaveBeenCalledWith(expect.objectContaining({
            thumbnailRouteKey: 'route-unavailable',
            thumbnailLink: { linkId: 'link-1', thumbHandle: 'thumb-2' },
        }));
    });

    it('hands the route shape to the thumbnail as its fallback', () => {
        mockSecureImage.mockClear();
        render(<RouteItemView {...ROUTE_ITEM_UNAVAILABLE} {...HANDLERS} />);
        expect(mockSecureImage.mock.calls[0][0]).toHaveProperty('fallback');
    });

    it('renders a route that has a copy on this device', () => {
        const onDeleteLocalCopy = jest.fn();
        render(<RouteItemView {...ROUTE_ITEM_LOCAL_COPY} {...HANDLERS} onDeleteLocalCopy={onDeleteLocalCopy} />);
    });
});
