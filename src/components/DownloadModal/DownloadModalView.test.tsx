import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { DownloadModalView } from './DownloadModalView';
import { SERVER_ROWS, ICLOUD_ROWS, ALL_ROWS, LEGACY_SHAPE_SERVER_ROWS } from './DownloadModal.mock';

const MOCK_PROPS = {
    visible: true,
    rows: LEGACY_SHAPE_SERVER_ROWS,
    onStop: jest.fn(),
    onRetry: jest.fn(),
    onDelete: jest.fn(),
    onKeepInstead: jest.fn(),
    onClose: jest.fn(),
};

describe('DownloadModalView', () => {
    it('renders correctly when visible', () => {
        const { getByText } = render(<DownloadModalView {...MOCK_PROPS} />);
        expect(getByText('Stelvio Pass')).toBeTruthy();
        expect(getByText('Saved for offline riding')).toBeTruthy();
        expect(getByText('Download failed')).toBeTruthy();
        expect(getByText('Download required to ride')).toBeTruthy();
    });

    it('renders empty state when rows are empty', () => {
        const { getByText } = render(<DownloadModalView {...MOCK_PROPS} rows={[]} />);
        expect(getByText('No downloads')).toBeTruthy();
    });

    it('does not render when not visible', () => {
        const { queryByText } = render(<DownloadModalView {...MOCK_PROPS} visible={false} />);
        expect(queryByText('Downloads')).toBeNull();
    });

    describe('server rows regression', () => {
        // Structural comparison of the rendered tree, ignoring function identity (each render
        // creates fresh useCallback closures, so a literal toEqual would fail even on an
        // unchanged component). Everything a user or a snapshot would notice - elements, text,
        // styles, props - is preserved.
        const withoutFunctions = (tree: unknown) =>
            JSON.stringify(tree, (_key, value) => (typeof value === 'function' ? undefined : value));

        it('renders the same tree for the legacy row shape (no source/actions) and today\'s shape (source:"server" + actions)', () => {
            const legacy = render(<DownloadModalView {...MOCK_PROPS} rows={LEGACY_SHAPE_SERVER_ROWS} />);
            const legacyTree = withoutFunctions(legacy.toJSON());
            legacy.unmount();

            const current = render(<DownloadModalView {...MOCK_PROPS} rows={SERVER_ROWS} />);
            const currentTree = withoutFunctions(current.toJSON());
            current.unmount();

            expect(currentTree).toEqual(legacyTree);
        });

        it('downloading: shows the progress bar, percentage and Stop', () => {
            const { getByText } = render(<DownloadModalView {...MOCK_PROPS} rows={[SERVER_ROWS[0]]} />);
            expect(getByText('61%')).toBeTruthy();
            expect(getByText('Stop')).toBeTruthy();
        });

        it('done: shows "Saved for offline riding" and Delete', () => {
            const { getByText } = render(<DownloadModalView {...MOCK_PROPS} rows={[SERVER_ROWS[1]]} />);
            expect(getByText('Saved for offline riding')).toBeTruthy();
            expect(getByText('Delete')).toBeTruthy();
        });

        it('failed: shows "Download failed" and Retry Download', () => {
            const { getByText } = render(<DownloadModalView {...MOCK_PROPS} rows={[SERVER_ROWS[2]]} />);
            expect(getByText('Download failed')).toBeTruthy();
            expect(getByText('Retry Download')).toBeTruthy();
        });

        it('required: shows "Download required to ride" and Download', () => {
            const { getByText } = render(<DownloadModalView {...MOCK_PROPS} rows={[SERVER_ROWS[3]]} />);
            expect(getByText('Download required to ride')).toBeTruthy();
            expect(getByText('Download')).toBeTruthy();
        });

        it('never renders a Keep it instead button for a server row', () => {
            const { queryByText } = render(<DownloadModalView {...MOCK_PROPS} rows={SERVER_ROWS} />);
            expect(queryByText('Keep it instead')).toBeNull();
        });
    });

    describe('iCloud rows', () => {
        it('downloading: shows the From iCloud text and Stop, no percentage', () => {
            const row = ICLOUD_ROWS.find(r => r.routeId === 'ic-downloading')!;
            const { getByText, queryByText } = render(<DownloadModalView {...MOCK_PROPS} rows={[row]} />);
            expect(getByText(/From iCloud/)).toBeTruthy();
            expect(getByText('Stop')).toBeTruthy();
            expect(queryByText(/^\d+%$/)).toBeNull();
        });

        it('waiting: shows the warning text and Stop', () => {
            const row = ICLOUD_ROWS.find(r => r.routeId === 'ic-waiting')!;
            const { getByText } = render(<DownloadModalView {...MOCK_PROPS} rows={[row]} />);
            expect(getByText(/Waiting for internet/)).toBeTruthy();
            expect(getByText('Stop')).toBeTruthy();
        });

        it('done, kept: shows the kept text and no action button', () => {
            const row = ICLOUD_ROWS.find(r => r.routeId === 'ic-done-kept')!;
            const { getByText, queryByText } = render(<DownloadModalView {...MOCK_PROPS} rows={[row]} />);
            expect(getByText('Downloaded to this iPad')).toBeTruthy();
            expect(queryByText('Delete')).toBeNull();
            expect(queryByText('Keep it instead')).toBeNull();
        });

        it('done, for this ride: shows the removal notice and Keep it instead', () => {
            const row = ICLOUD_ROWS.find(r => r.routeId === 'ic-done-this-ride')!;
            const { getByText } = render(<DownloadModalView {...MOCK_PROPS} rows={[row]} />);
            expect(getByText('Downloaded for this ride — removed when you leave it')).toBeTruthy();
            expect(getByText('Keep it instead')).toBeTruthy();
        });

        it('failed: shows Download failed and Retry Download, never Delete', () => {
            const row = ICLOUD_ROWS.find(r => r.routeId === 'ic-failed')!;
            const { getByText, queryByText } = render(<DownloadModalView {...MOCK_PROPS} rows={[row]} />);
            expect(getByText('Download failed')).toBeTruthy();
            expect(getByText('Retry Download')).toBeTruthy();
            expect(queryByText('Delete')).toBeNull();
        });

        it('not enough storage: shows the size detail and no action', () => {
            const row = ICLOUD_ROWS.find(r => r.routeId === 'ic-not-enough-storage')!;
            const { getByText, queryByText } = render(<DownloadModalView {...MOCK_PROPS} rows={[row]} />);
            expect(getByText('Not enough free space — needs 4.7 GB, 1.3 GB free')).toBeTruthy();
            expect(queryByText('Stop')).toBeNull();
            expect(queryByText('Retry Download')).toBeNull();
        });

        it('compact layout uses the shortened texts', () => {
            const row = ICLOUD_ROWS.find(r => r.routeId === 'ic-downloading')!;
            const { getByText } = render(<DownloadModalView {...MOCK_PROPS} rows={[row]} compact />);
            expect(getByText(/^iCloud/)).toBeTruthy();
        });

        it('never renders a Delete button for any iCloud row', () => {
            const { queryByText } = render(<DownloadModalView {...MOCK_PROPS} rows={ICLOUD_ROWS} />);
            expect(queryByText('Delete')).toBeNull();
        });
    });

    describe('action forwarding', () => {
        it('forwards onStop with the routeId for an iCloud downloading row', () => {
            const onStop = jest.fn();
            const row = ICLOUD_ROWS.find(r => r.routeId === 'ic-downloading')!;
            const { getByText } = render(<DownloadModalView {...MOCK_PROPS} onStop={onStop} rows={[row]} />);
            fireEvent.press(getByText('Stop'));
            expect(onStop).toHaveBeenCalledWith('ic-downloading');
        });

        it('forwards onRetry with the routeId for an iCloud failed row', () => {
            const onRetry = jest.fn();
            const row = ICLOUD_ROWS.find(r => r.routeId === 'ic-failed')!;
            const { getByText } = render(<DownloadModalView {...MOCK_PROPS} onRetry={onRetry} rows={[row]} />);
            fireEvent.press(getByText('Retry Download'));
            expect(onRetry).toHaveBeenCalledWith('ic-failed');
        });

        it('forwards onKeepInstead with the routeId for an iCloud this-ride row', () => {
            const onKeepInstead = jest.fn();
            const row = ICLOUD_ROWS.find(r => r.routeId === 'ic-done-this-ride')!;
            const { getByText } = render(<DownloadModalView {...MOCK_PROPS} onKeepInstead={onKeepInstead} rows={[row]} />);
            fireEvent.press(getByText('Keep it instead'));
            expect(onKeepInstead).toHaveBeenCalledWith('ic-done-this-ride');
        });

        it('forwards onDelete with the routeId for a server done row', () => {
            const onDelete = jest.fn();
            const row = SERVER_ROWS.find(r => r.routeId === 'srv-done')!;
            const { getByText } = render(<DownloadModalView {...MOCK_PROPS} onDelete={onDelete} rows={[row]} />);
            fireEvent.press(getByText('Delete'));
            expect(onDelete).toHaveBeenCalledWith('srv-done');
        });
    });

    it('renders every row variant (server + iCloud) without crashing', () => {
        const { toJSON } = render(<DownloadModalView {...MOCK_PROPS} rows={ALL_ROWS} />);
        expect(toJSON()).toBeDefined();
    });
});
