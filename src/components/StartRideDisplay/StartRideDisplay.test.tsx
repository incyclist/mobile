import React from 'react';
import { render } from '@testing-library/react-native';
import { StartRideDisplay } from './StartRideDisplay';
import { StartRideDisplayProps } from './types';

const noop = () => {};

const baseProps = {
    mode: 'GPX',
    devices: [
        { udid: 'trainer-1', name: 'Smart Trainer', isControl: true, status: 'Starting' },
        { udid: 'hrm-1', name: 'HRM', isControl: false, status: 'Starting' },
    ],
    mapType: 'Street View',
    mapState: 'Loaded',
    onStart: noop,
    onRetry: noop,
    onCancel: noop,
    onIgnore: noop,
} as unknown as StartRideDisplayProps;

describe('StartRideDisplay', () => {
    it('offers only Cancel while not ready to start', () => {
        const { getByText, queryByText } = render(
            <StartRideDisplay {...baseProps} rideState="Starting" readyToStart={false} />
        );

        expect(getByText('Cancel')).toBeTruthy();
        expect(queryByText('Start')).toBeNull();
    });

    it('offers Start + Cancel once readyToStart is true', () => {
        const { getByText } = render(
            <StartRideDisplay {...baseProps} rideState="Starting" readyToStart={true} />
        );

        expect(getByText('Start')).toBeTruthy();
        expect(getByText('Cancel')).toBeTruthy();
    });

    // FIXES_BACKLOG #52 — the reported iOS scenario: a non-control device (HRM) fails while the
    // control device (trainer) has already started. `rideState` stays 'Starting' (not 'Error'),
    // so the sensor-error dialog must not take over — the 'starting' dialog stays up and, once
    // `readyToStart` flips true, must offer the Start button so the rider can proceed without the
    // failed sensor. This drives the exact prop transition from the backlog's captured log:
    //   1. trainer Started, HRM Starting,  readyToStart:true
    //   2. trainer Started, HRM Error,     readyToStart:true
    it('re-renders to show the Start button when props update from readyToStart:false to true with a failed non-control device', () => {
        const devicesHrmStarting = [
            { udid: 'trainer-1', name: 'Smart Trainer', isControl: true, status: 'Starting' },
            { udid: 'hrm-1', name: 'HRM', isControl: false, status: 'Starting' },
        ];
        const devicesHrmError = [
            { udid: 'trainer-1', name: 'Smart Trainer', isControl: true, status: 'Started' },
            { udid: 'hrm-1', name: 'HRM', isControl: false, status: 'Error' },
        ];

        const { getByText, queryByText, rerender } = render(
            <StartRideDisplay
                {...baseProps}
                devices={devicesHrmStarting}
                rideState="Starting"
                readyToStart={false}
            />
        );

        expect(queryByText('Start')).toBeNull();

        // trainer Started, HRM Starting, readyToStart:true (first logged update)
        rerender(
            <StartRideDisplay
                {...baseProps}
                devices={devicesHrmStarting}
                rideState="Starting"
                readyToStart={true}
            />
        );
        expect(getByText('Start')).toBeTruthy();

        // trainer Started, HRM Error, readyToStart:true (second logged update) - still 'Starting',
        // so the sensor-error dialog (Retry/Ignore/Cancel) must NOT take over; Start must remain.
        rerender(
            <StartRideDisplay
                {...baseProps}
                devices={devicesHrmError}
                rideState="Starting"
                readyToStart={true}
            />
        );
        expect(getByText('Start')).toBeTruthy();
        expect(queryByText('Retry')).toBeNull();
        expect(queryByText('Ignore')).toBeNull();
    });

    it('shows the sensor-error dialog (not the starting dialog) once rideState actually becomes Error', () => {
        const devices = [
            { udid: 'trainer-1', name: 'Smart Trainer', isControl: true, status: 'Started' },
            { udid: 'hrm-1', name: 'HRM', isControl: false, status: 'Error' },
        ];

        const { getByText, queryByText } = render(
            <StartRideDisplay {...baseProps} devices={devices} rideState="Error" readyToStart={true} />
        );

        expect(getByText('Retry')).toBeTruthy();
        expect(getByText('Ignore')).toBeTruthy();
        expect(queryByText('Start')).toBeNull();
    });
});
