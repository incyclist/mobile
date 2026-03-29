import React from 'react';
import { render } from '@testing-library/react-native';
import { VideoDemoView } from './View';
import { useScreenLayout } from '../../hooks/render/useScreenLayout';

jest.mock('../../hooks/render/useScreenLayout');
jest.mock('../../components', () => ({
    NavigationBar: () => null,
    Video: () => null,
    Dynamic: ({ children }: any) => children,
}));
jest.mock('incyclist-services', () => ({
    Observer: jest.fn().mockImplementation(() => ({
        on: jest.fn(),
        emit: jest.fn(),
        stop: jest.fn(),
    })),
}));

describe('VideoDemoView', () => {
    const mockProps = {
        onClick: jest.fn(),
    };

    it('renders correctly in normal layout', () => {
        (useScreenLayout as jest.Mock).mockReturnValue('normal');
        const { toJSON } = render(<VideoDemoView {...mockProps} />);
        expect(toJSON()).toMatchSnapshot();
    });

    it('renders correctly in compact layout', () => {
        (useScreenLayout as jest.Mock).mockReturnValue('compact');
        const { toJSON } = render(<VideoDemoView {...mockProps} />);
        expect(toJSON()).toMatchSnapshot();
    });
});