import React from 'react';
import { render } from '@testing-library/react-native';
import { PasswordEdit } from './PasswordEdit';
import { PasswordEditProps } from './types';

const MOCK_PROPS: PasswordEditProps = {
    label: 'Password',
    value: 'secret',
    onChangeText: jest.fn(),
};

describe('PasswordEdit', () => {
    it('renders in normal layout', () => {
        render(<PasswordEdit {...MOCK_PROPS} />);
    });

    it('renders in compact layout', () => {
        render(<PasswordEdit {...MOCK_PROPS} compact={true} />);
    });

    it('renders with all optional props undefined', () => {
        render(<PasswordEdit />);
    });

    it('renders with disabled={true}', () => {
        render(<PasswordEdit {...MOCK_PROPS} disabled={true} />);
    });

    it('renders with hasError={true}', () => {
        render(<PasswordEdit {...MOCK_PROPS} hasError={true} />);
    });
});