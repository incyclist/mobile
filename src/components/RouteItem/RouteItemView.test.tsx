import React from 'react';
import { render } from '@testing-library/react-native';
import { RouteItemView } from './RouteItemView';
import { ROUTE_ITEM_IN_ICLOUD, ROUTE_ITEM_DOWNLOADING, ROUTE_ITEM_NO_PILL } from './RouteItem.mock';

// RouteItemView renders SecureImage, which pulls in the fs binding and a native TurboModule -
// not under test here, and not available in the Jest environment. Stub it out.
jest.mock('../SecureImage', () => ({
    SecureImage: () => null,
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
