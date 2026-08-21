import React from 'react';
import { render } from '@testing-library/react-native';
import { NotImplementedView } from './NotImplementedPage';

// TransitionShell (nav sidebar + centered content, including the compact/normal layout switch)
// is now shared with PageTransitionView (FIXES_BACKLOG.md item #63 - SonarCloud duplication) and
// has its own dedicated tests (src/components/TransitionShell/TransitionShell.test.tsx). Mocking
// the whole '../../components' barrel here (rather than just NavigationBar/MainBackground) avoids
// pulling in the barrel's full transitive component tree, which drags in native-module-backed
// code (e.g. react-native-fs via SecureImage/RouteItem/RoutesTable) that Jest can't parse. This
// test only needs to confirm NotImplementedView wires TransitionShell with the right props and
// renders the right message.
const mockTransitionShell = jest.fn();
jest.mock('../../components', () => {
    const { View } = require('react-native');
    return {
        TransitionShell: (props: any) => {
            mockTransitionShell(props);
            return <View>{props.children}</View>;
        },
    };
});
jest.mock('incyclist-services', () => ({
    useIncyclist: () => ({
        onAppExit: jest.fn().mockResolvedValue(undefined),
    }),
}));
jest.mock('../../bindings/ui', () => ({
    getUIBinding: () => ({
        quit: jest.fn(),
    }),
}));

jest.mock('../../services', () => ({
    navigate: jest.fn(),
}));

describe('NotImplementedView', () => {
    const mockProps: any = {
        onClick: jest.fn(),
        selected: 'routes',
    };

    beforeEach(() => jest.clearAllMocks());

    it('renders the "Not yet implemented" message', () => {
        const { getByText } = render(<NotImplementedView {...mockProps} />);
        expect(getByText('Not yet implemented')).toBeTruthy();
    });

    it('forwards selected and onClick to TransitionShell', () => {
        const onClick = jest.fn();
        render(<NotImplementedView {...mockProps} onClick={onClick} />);
        expect(mockTransitionShell).toHaveBeenCalledWith(
            expect.objectContaining({ selected: 'routes', onClick })
        );
    });
});
