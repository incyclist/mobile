import React from 'react';
import { render } from '@testing-library/react-native';
import { MainPageView } from './View';
import { useScreenLayout } from '../../hooks/render/useScreenLayout';

jest.mock('../../hooks/render/useScreenLayout');
jest.mock('../../components', () => ({
    NavigationBar: () => null,
    MainBackground: ({ children }: any) => children,
    ElevationGraph: () => null,
}));

describe('MainPageView', () => {
    const mockProps = {
        onClick: jest.fn(),
    };

    it('renders correctly in normal layout', () => {
        (useScreenLayout as jest.Mock).mockReturnValue('normal');
        const { toJSON } = render(<MainPageView {...mockProps} />);
        expect(toJSON()).toMatchSnapshot();
    });

    it('renders correctly in compact layout', () => {
        (useScreenLayout as jest.Mock).mockReturnValue('compact');
        const { toJSON } = render(<MainPageView {...mockProps} />);
        expect(toJSON()).toMatchSnapshot();
    });
});