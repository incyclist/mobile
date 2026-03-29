import React from 'react';
import { render } from '@testing-library/react-native';
import { NotImplementedView } from './NotImplementedPage';
import { useScreenLayout } from '../../hooks/render/useScreenLayout';

jest.mock('../../hooks/render/useScreenLayout');
jest.mock('../../components', () => ({
    NavigationBar: () => null,
    MainBackground: ({ children }: any) => children,
}));

describe('NotImplementedView', () => {
    const mockProps: any = {
        onClick: jest.fn(),
        selected: 'routes',
    };

    it('renders correctly in normal layout', () => {
        (useScreenLayout as jest.Mock).mockReturnValue('normal');
        const { toJSON } = render(<NotImplementedView {...mockProps} />);
        expect(toJSON()).toMatchSnapshot();
    });

    it('renders correctly in compact layout', () => {
        (useScreenLayout as jest.Mock).mockReturnValue('compact');
        const { toJSON } = render(<NotImplementedView {...mockProps} />);
        expect(toJSON()).toMatchSnapshot();
    });
});