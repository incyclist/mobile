import React from 'react';
import { render } from '@testing-library/react-native';
import { ScheduledWorkoutPromptModal } from './ScheduledWorkoutPromptModal';
import { ScheduledWorkoutPromptProps } from './types';

const MOCK_PROPS: ScheduledWorkoutPromptProps = {
    visible: true,
    title: 'VO2 Max Intervals',
    onYes: jest.fn(),
    onNo: jest.fn(),
    onCheckWorkouts: jest.fn(),
};

describe('ScheduledWorkoutPromptModal', () => {
    it('renders when visible', () => {
        render(<ScheduledWorkoutPromptModal {...MOCK_PROPS} />);
    });

    it('renders when not visible', () => {
        render(<ScheduledWorkoutPromptModal {...MOCK_PROPS} visible={false} />);
    });
});
