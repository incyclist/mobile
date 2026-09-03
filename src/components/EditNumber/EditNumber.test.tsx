import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { EditNumber } from './EditNumber';
import { EditNumberProps } from './types';

const MOCK_EDIT_NUMBER_PROPS: EditNumberProps = {
    label: 'FTP',
    value: 224,
    unit: 'W',
    onValueChange: jest.fn(),
};

describe('EditNumber', () => {
    it('renders with a value', () => {
        const { getByDisplayValue, getByText } = render(<EditNumber {...MOCK_EDIT_NUMBER_PROPS} />);
        expect(getByText('FTP')).toBeTruthy();
        expect(getByDisplayValue('224')).toBeTruthy();
    });

    it('renders without a value', () => {
        const { getByText } = render(<EditNumber label="Empty" onValueChange={jest.fn()} />);
        expect(getByText('Empty')).toBeTruthy();
    });

    it('renders with unit suffix', () => {
        const { getByText } = render(<EditNumber {...MOCK_EDIT_NUMBER_PROPS} />);
        expect(getByText('W')).toBeTruthy();
    });

    it('renders with min/max props and shows error', () => {
        const { getByDisplayValue, getByText } = render(
            <EditNumber {...MOCK_EDIT_NUMBER_PROPS} min={100} max={300} />
        );
        const input = getByDisplayValue('224');

        fireEvent.changeText(input, '50');
        fireEvent(input, 'blur');
        expect(getByText('Minimum value is 100')).toBeTruthy();

        fireEvent.changeText(input, '400');
        fireEvent(input, 'blur');
        expect(getByText('Maximum value is 300')).toBeTruthy();
    });

    it('calls onValueChange with number on commit', () => {
        const onValueChange = jest.fn();
        const { getByDisplayValue } = render(
            <EditNumber {...MOCK_EDIT_NUMBER_PROPS} onValueChange={onValueChange} />
        );
        const input = getByDisplayValue('224');

        fireEvent.changeText(input, '250');
        fireEvent(input, 'blur');
        expect(onValueChange).toHaveBeenCalledWith(250);
    });

    it('silently rejects non-numeric input', () => {
        const onValueChange = jest.fn();
        const { getByDisplayValue } = render(
            <EditNumber {...MOCK_EDIT_NUMBER_PROPS} onValueChange={onValueChange} />
        );
        const input = getByDisplayValue('224');

        fireEvent.changeText(input, 'abc');
        fireEvent(input, 'blur');
        expect(onValueChange).not.toHaveBeenCalled();
        expect(getByDisplayValue('abc')).toBeTruthy();
    });
});
// `min`, `max` and `value` are typed as optional numbers, but callers routinely pass an explicit
// null for "not known yet" - e.g. RouteDetailsView feeds `max={totalDistance.value}`, and a route
// whose details carry no points has a distance of null rather than undefined.
describe('EditNumber - null instead of undefined for an absent number', () => {

    it('renders when max is null', () => {
        const { getByText } = render(
            <EditNumber label="Start" value={0} max={null as any} onValueChange={jest.fn()} />
        );
        expect(getByText('Start')).toBeTruthy();
    });

    it('renders when min is null', () => {
        const { getByText } = render(
            <EditNumber label="Start" value={0} min={null as any} onValueChange={jest.fn()} />
        );
        expect(getByText('Start')).toBeTruthy();
    });

    it('renders when value is null and no bounds are given', () => {
        const { getByText } = render(
            <EditNumber label="Start" value={null as any} onValueChange={jest.fn()} />
        );
        expect(getByText('Start')).toBeTruthy();
    });

    it('does not enforce a null bound as if it were zero', () => {
        const onValueChange = jest.fn();
        const { getByDisplayValue, queryByText } = render(
            <EditNumber label="Start" value={10} min={null as any} max={null as any}
                onValueChange={onValueChange} />
        );
        const input = getByDisplayValue('10');

        fireEvent.changeText(input, '25');
        fireEvent(input, 'blur');

        expect(queryByText(/Maximum value is/)).toBeNull();
        expect(queryByText(/Minimum value is/)).toBeNull();
        expect(onValueChange).toHaveBeenCalledWith(25);
    });
});
