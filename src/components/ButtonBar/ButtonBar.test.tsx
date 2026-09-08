import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button, ButtonBar } from './ButtonBar';
import { useScreenLayout } from '../../hooks';

jest.mock('../../hooks', () => ({
    useLogging: () => ({ logEvent: jest.fn(), logError: jest.fn() }),
    useScreenLayout: jest.fn(() => 'normal'),
}));

describe('Button', () => {
    beforeEach(() => jest.clearAllMocks());

    it('renders with no hitSlop in normal (non-compact) layout', () => {
        (useScreenLayout as jest.Mock).mockReturnValue('normal');

        const { getByText } = render(<Button id="a" label="OK" onClick={jest.fn()} />);
        const touchable = getByText('OK').parent?.parent;

        expect(touchable?.props.hitSlop).toBeUndefined();
    });

    // Compact mode's small visible size is intentional (saves vertical space in landscape on
    // short phones) and must not change - the touch target is expanded via hitSlop instead of
    // growing the button, and kept within the 8px marginHorizontal gap between buttons so
    // neighboring buttons' tappable regions don't overlap.
    it('expands the touchable region via hitSlop in compact layout, without growing the button', () => {
        (useScreenLayout as jest.Mock).mockReturnValue('compact');

        const { getByText } = render(<Button id="a" label="OK" onClick={jest.fn()} />);
        const touchable = getByText('OK').parent?.parent;

        expect(touchable?.props.hitSlop).toEqual(expect.objectContaining({
            top: expect.any(Number),
            bottom: expect.any(Number),
        }));
        expect(touchable?.props.hitSlop.top).toBeGreaterThan(0);
        expect(touchable?.props.hitSlop.bottom).toBeGreaterThan(0);
        // marginHorizontal between adjacent buttons is 8px each side (16px total gap) - the
        // horizontal hitSlop must stay under that so two buttons' hit-slop regions can't overlap.
        expect(touchable?.props.hitSlop.left).toBeLessThan(8);
        expect(touchable?.props.hitSlop.right).toBeLessThan(8);
    });

    it('still fires onClick when compact', () => {
        (useScreenLayout as jest.Mock).mockReturnValue('compact');
        const onClick = jest.fn();

        const { getByText } = render(<Button id="a" label="OK" onClick={onClick} />);
        fireEvent.press(getByText('OK'));

        expect(onClick).toHaveBeenCalled();
    });
});

describe('ButtonBar', () => {
    it('renders one Button per entry', () => {
        (useScreenLayout as jest.Mock).mockReturnValue('normal');

        const { getByText } = render(
            <ButtonBar buttons={[
                { id: 'a', label: 'A', onClick: jest.fn() },
                { id: 'b', label: 'B', onClick: jest.fn() },
            ]} />
        );

        expect(getByText('A')).toBeTruthy();
        expect(getByText('B')).toBeTruthy();
    });
});
