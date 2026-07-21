import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { WorkoutItemView } from './WorkoutItemView';
import { MOCK_PLAN, MOCK_PLAN_SHORT } from '../WorkoutGraph/WorkoutGraph.mock';
import { WorkoutGraphPlan } from '../WorkoutGraph';

const EMPTY_PLAN: WorkoutGraphPlan = {
    bars: [],
    ftp: 230,
    ftpLine: 230,
    domain: { x: [0, 0], y: [0, 0] },
};

const baseProps = {
    id: '1',
    title: 'Sweet Spot Base',
    group: 'FTP Builder',
    duration: '35min',
    selected: false,
    canDelete: true,
    plan: MOCK_PLAN,
    onOpenDetails: jest.fn(),
    onDelete: jest.fn(),
};

describe('WorkoutItemView', () => {
    it('renders without crashing', () => {
        const { toJSON } = render(<WorkoutItemView {...baseProps} />);
        expect(toJSON()).not.toBeNull();
    });

    it('renders a short workout without crashing', () => {
        const { toJSON } = render(<WorkoutItemView {...baseProps} plan={MOCK_PLAN_SHORT} />);
        expect(toJSON()).not.toBeNull();
    });

    it('renders a workout with no bars without crashing', () => {
        const { toJSON } = render(<WorkoutItemView {...baseProps} plan={EMPTY_PLAN} />);
        expect(toJSON()).not.toBeNull();
    });

    it('renders nothing but a placeholder when outsideFold is true', () => {
        const { toJSON } = render(<WorkoutItemView {...baseProps} outsideFold />);
        expect(toJSON()).not.toBeNull();
    });

    it('renders without the delete swipe action when canDelete is false', () => {
        const { toJSON } = render(<WorkoutItemView {...baseProps} canDelete={false} />);
        expect(toJSON()).not.toBeNull();
    });

    it('renders a scheduled date without crashing', () => {
        const { toJSON } = render(<WorkoutItemView {...baseProps} scheduledLabel="20.07.2026" />);
        expect(toJSON()).not.toBeNull();
    });

    it('renders the isToday highlight without crashing', () => {
        const { toJSON } = render(
            <WorkoutItemView {...baseProps} scheduledLabel="Today" isToday />
        );
        expect(toJSON()).not.toBeNull();
    });

    // Regression test for the "swipe reveals delete, tap does nothing" bug (session 5.14).
    // In this test environment react-native-gesture-handler's native module isn't available
    // (Swipeable's own require() throws), so this exercises WorkoutItemView's fallback
    // rendering path rather than the real native Swipeable. Before this fix, the fallback
    // discarded `renderRightActions` entirely, so the delete button never rendered here (or
    // in Storybook) and this wiring was never actually under test. This confirms the
    // onPress -> onDelete(id) wiring itself is correct; it cannot confirm or rule out a
    // native-gesture-timing issue specific to the real Swipeable on a physical device.
    it('calls onDelete with the workout id when the revealed delete action is pressed', () => {
        const { getByText } = render(<WorkoutItemView {...baseProps} />);
        fireEvent.press(getByText('Delete'));
        expect(baseProps.onDelete).toHaveBeenCalledWith('1');
    });

    it('does not render a delete action when canDelete is false', () => {
        const { queryByText } = render(<WorkoutItemView {...baseProps} canDelete={false} />);
        expect(queryByText('Delete')).toBeNull();
    });
});
