import React from 'react';
import { render } from '@testing-library/react-native';
import { ImportingView } from './ImportingView';

describe('ImportingView', () => {
    it('renders without crashing', () => {
        render(<ImportingView compact={false} fileName="sweet-spot.zwo" />);
    });

    it('renders without a file name without crashing', () => {
        render(<ImportingView compact={false} />);
    });

    it('renders correctly in compact mode', () => {
        render(<ImportingView compact={true} fileName="sweet-spot.zwo" />);
    });
});
