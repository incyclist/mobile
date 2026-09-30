import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { StartRideDisplay } from './StartRideDisplay';
import { StartRideDisplayProps } from './types';
import { CurrentRideDeviceInfo } from 'incyclist-services';

const noop = () => {};

const trainer = (status: CurrentRideDeviceInfo['status']): CurrentRideDeviceInfo => ({
    udid: 'trainer-1', name: 'Smart Trainer', isControl: true, status, capabilities: ['control'],
});

const hrm = (status: CurrentRideDeviceInfo['status']): CurrentRideDeviceInfo => ({
    udid: 'hrm-1', name: 'HRM', isControl: false, status, capabilities: ['heartrate'],
});

const baseProps = {
    mode: 'GPX',
    devices: [trainer('Starting'), hrm('Starting')],
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
        const devicesHrmStarting = [trainer('Starting'), hrm('Starting')];
        const devicesHrmError = [trainer('Started'), hrm('Error')];

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
        const devices = [trainer('Started'), hrm('Error')];

        const { getByText, queryByText } = render(
            <StartRideDisplay {...baseProps} devices={devices} rideState="Error" readyToStart={true} />
        );

        expect(getByText('Retry')).toBeTruthy();
        expect(getByText('Ignore')).toBeTruthy();
        expect(queryByText('Start')).toBeNull();
    });

    // INC-42 - Street View-specific content, gated on `viewState`. Every test above has no
    // `viewState` and is the acceptance reference for "unchanged".
    describe('Street View start (INC-42)', () => {
        it('shows "Preparing Street View ..." and "Loading ..." while loading, no Start with Map yet', () => {
            const { getByText, queryByText } = render(
                <StartRideDisplay {...baseProps} rideState="Starting" readyToStart={false} viewState="loading" />
            );

            expect(getByText('Preparing Street View ...')).toBeTruthy();
            expect(getByText('Loading ...')).toBeTruthy();
            expect(queryByText('Start with Map')).toBeNull();
        });

        it('shows "Still loading ..." and a Start with Map button once slow', () => {
            const onStartWithMap = jest.fn();
            const { getByText } = render(
                <StartRideDisplay
                    {...baseProps}
                    rideState="Starting"
                    readyToStart={false}
                    viewState="slow"
                    onStartWithMap={onStartWithMap}
                />
            );

            expect(getByText('Preparing Street View ...')).toBeTruthy();
            expect(getByText('Still loading ...')).toBeTruthy();

            fireEvent.press(getByText('Start with Map'));
            expect(onStartWithMap).toHaveBeenCalled();
        });

        it('shows the amber fallback row and today\'s heading once unavailable', () => {
            const { getByText, queryByText } = render(
                <StartRideDisplay {...baseProps} rideState="Starting" readyToStart={true} viewState="unavailable" />
            );

            // heading returns to the default once resolved (loaded or unavailable) - ux.md §7.2
            expect(getByText('Starting activity ...')).toBeTruthy();
            expect(getByText('Unavailable – using Map')).toBeTruthy();
            expect(queryByText('Start with Map')).toBeNull();
        });

        it('leaves device rows, sensor-error and device-error handling untouched on a Street View start', () => {
            const devices = [trainer('Started'), hrm('Error')];
            const { getByText, queryByText } = render(
                <StartRideDisplay {...baseProps} devices={devices} rideState="Error" readyToStart={true} viewState="loaded" />
            );

            expect(getByText('Retry')).toBeTruthy();
            expect(getByText('Ignore')).toBeTruthy();
            expect(queryByText('Start')).toBeNull();
        });
    });
});
