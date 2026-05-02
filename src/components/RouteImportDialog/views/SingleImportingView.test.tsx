import React from 'react';
import { render } from '@testing-library/react-native';
import { SingleImportingView } from './SingleImportingView';

describe('SingleImportingView', () => {
    it('renders without crashing', () => {
        render(<SingleImportingView compact={false} />);
    });

    it('renders correctly in compact mode', () => {
        render(<SingleImportingView compact={true} />);
    });
});