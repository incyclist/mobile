import React from 'react';
import { render } from '@testing-library/react-native';
import { SingleImportingView } from './SingleImportingView';

describe('SingleImportingView', () => {
    it('renders without crashing in normal mode', () => {
        render(<SingleImportingView compact={false} />);
    });

    it('renders without crashing in compact mode', () => {
        render(<SingleImportingView compact={true} />);
    });
});