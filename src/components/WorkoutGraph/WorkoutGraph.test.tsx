import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { View } from 'react-native';
import { WorkoutGraph } from './WorkoutGraph';
import { WorkoutGraphView } from './WorkoutGraphView';
import { MOCK_PLAN } from './WorkoutGraph.mock';

jest.mock('./WorkoutGraphView', () => ({
    WorkoutGraphView: jest.fn(() => null),
}));

const layout = (width: number, height: number) => ({
    nativeEvent: { layout: { x: 0, y: 0, width, height } },
});

describe('WorkoutGraph', () => {
    beforeEach(() => {
        (WorkoutGraphView as jest.Mock).mockClear();
    });

    it('forwards an explicit axisFontSize to WorkoutGraphView', () => {
        const { UNSAFE_root } = render(
            <WorkoutGraph mode="detail" plan={MOCK_PLAN} axisFontSize={15} />
        );
        const container = UNSAFE_root.findByType(View);
        fireEvent(container, 'layout', layout(360, 200));

        expect(WorkoutGraphView).toHaveBeenCalled();
        const props = (WorkoutGraphView as jest.Mock).mock.calls.at(-1)?.[0];
        expect(props.axisFontSize).toBe(15);
    });

    it('leaves axisFontSize undefined when not provided, so WorkoutGraphView keeps its own (phone) default', () => {
        const { UNSAFE_root } = render(
            <WorkoutGraph mode="detail" plan={MOCK_PLAN} />
        );
        const container = UNSAFE_root.findByType(View);
        fireEvent(container, 'layout', layout(360, 200));

        expect(WorkoutGraphView).toHaveBeenCalled();
        const props = (WorkoutGraphView as jest.Mock).mock.calls.at(-1)?.[0];
        expect(props.axisFontSize).toBeUndefined();
    });
});
