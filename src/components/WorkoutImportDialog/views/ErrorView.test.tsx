import React from 'react';
import { render } from '@testing-library/react-native';
import { ErrorView } from './ErrorView';

describe('ErrorView', () => {
    it('renders without crashing', () => {
        render(<ErrorView compact={false} error="The selected file is not a valid workout." />);
    });

    it('renders with a missing error message without crashing', () => {
        render(<ErrorView compact={false} />);
    });

    it('renders correctly in compact mode', () => {
        render(<ErrorView compact={true} error="The selected file is not a valid workout." />);
    });
});
