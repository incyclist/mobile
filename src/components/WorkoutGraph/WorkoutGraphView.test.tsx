import React from 'react';
import { render } from '@testing-library/react-native';
import { WorkoutGraphView } from './WorkoutGraphView';
import { MOCK_PLAN, MOCK_PLAN_SHORT } from './mockData';
import type { WorkoutGraphPlan } from './types';

const EMPTY_PLAN: WorkoutGraphPlan = {
    bars: [],
    ftp: 230,
    ftpLine: 230,
    domain: { x: [0, 0], y: [0, 0] },
};

describe('WorkoutGraphView', () => {
    it('renders strip mode with zone bars', () => {
        const { toJSON } = render(
            <WorkoutGraphView mode="strip" plan={MOCK_PLAN} width={350} height={44} />
        );
        expect(toJSON()).not.toBeNull();
    });

    it('renders detail mode (bars + FTP line + axes)', () => {
        const { toJSON } = render(
            <WorkoutGraphView mode="detail" plan={MOCK_PLAN} width={360} height={200} />
        );
        expect(toJSON()).not.toBeNull();
    });

    it('draws one Rect per plan bar', () => {
        const { UNSAFE_root } = render(
            <WorkoutGraphView mode="strip" plan={MOCK_PLAN} width={350} height={44} />
        );
        // react-native-svg mocks render as host components named 'RNSVGRect'
        const rects = UNSAFE_root.findAll(
            node => typeof node.type === 'string' && node.type.includes('Rect')
        );
        expect(rects.length).toBe(MOCK_PLAN.bars.length);
    });

    it('renders nothing for zero width', () => {
        const { toJSON } = render(
            <WorkoutGraphView mode="detail" plan={MOCK_PLAN} width={0} height={200} />
        );
        expect(toJSON()).toBeNull();
    });

    it('handles an empty plan without throwing', () => {
        const { toJSON } = render(
            <WorkoutGraphView mode="detail" plan={EMPTY_PLAN} width={360} height={200} />
        );
        expect(toJSON()).not.toBeNull();
    });

    it('respects explicit showFtpLine / showAxes overrides', () => {
        const { toJSON } = render(
            <WorkoutGraphView
                mode="strip"
                plan={MOCK_PLAN_SHORT}
                width={360}
                height={200}
                showFtpLine
                showAxes
            />
        );
        expect(toJSON()).not.toBeNull();
    });
});
