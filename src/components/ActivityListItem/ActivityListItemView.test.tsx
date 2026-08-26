import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ActivityListItemView } from './ActivityListItemView';
import { ActivityListItemViewProps } from './types';

const MOCK_PROPS: ActivityListItemViewProps = {
    title: 'LaonParis',
    dateStr: '31.03.2026',
    timeStr: '12:32',
    durationStr: '45min',
    distanceValue: '32.4',
    distanceUnit: 'km',
    elevationValue: '420',
    elevationUnit: 'm',
    details: undefined,
    compact: false,
    outsideFold: false,
    onPress: () => {},
    onDelete: () => {},
};

describe('ActivityListItemView', () => {
    it('renders normal layout', () => {
        render(<ActivityListItemView {...MOCK_PROPS} />);
    });

    it('renders compact layout', () => {
        render(<ActivityListItemView {...MOCK_PROPS} compact={true} />);
    });

    it('renders with details undefined', () => {
        render(<ActivityListItemView {...MOCK_PROPS} details={undefined} />);
    });

    it('renders when outside fold', () => {
        render(<ActivityListItemView {...MOCK_PROPS} outsideFold={true} />);
    });

    it('calls onDelete when the swipe delete action is pressed', () => {
        const onDelete = jest.fn();
        const { getByText } = render(<ActivityListItemView {...MOCK_PROPS} onDelete={onDelete} />);

        fireEvent.press(getByText('Delete'));

        expect(onDelete).toHaveBeenCalledTimes(1);
    });
});