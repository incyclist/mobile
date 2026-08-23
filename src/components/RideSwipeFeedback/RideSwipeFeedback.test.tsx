import React from 'react';
import { render } from '@testing-library/react-native';
import { RideSwipeFeedback } from './RideSwipeFeedback';

describe('RideSwipeFeedback', () => {
    it('renders nothing when not visible', () => {
        const { queryByText, toJSON } = render(<RideSwipeFeedback visible={false} message="+1%" />);
        expect(queryByText('+1%')).toBeNull();
        expect(toJSON()).toBeNull();
    });

    it('renders the message when visible', () => {
        const { getByText } = render(<RideSwipeFeedback visible={true} message="Step Forward ▶" />);
        expect(getByText('Step Forward ▶')).toBeTruthy();
    });
});
