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
    startPhase: 'devices',
    onStart: noop,
    onRetry: noop,
    onCancel: noop,
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

    // FIXES_BACKLOG #52 - the reported iOS scenario: a non-control device (HRM) fails while the
    // control device (trainer) has already started. `rideState` stays 'Starting', and once
    // `readyToStart` flips true the Start button must be offered so the rider can proceed without
    // the failed sensor; the failed sensor is shown inline, never as a separate error dialog.
    it('re-renders to show the Start button when props update from readyToStart:false to true with a failed non-control device', () => {
        const devicesHrmStarting = [trainer('Starting'), hrm('Starting')];
        const devicesHrmError = [trainer('Started'), hrm('Error')];

        const { getByText, queryByText, rerender } = render(
            <StartRideDisplay {...baseProps} devices={devicesHrmStarting} rideState="Starting" readyToStart={false} />
        );

        expect(queryByText('Start')).toBeNull();

        rerender(
            <StartRideDisplay {...baseProps} devices={devicesHrmStarting} rideState="Starting" readyToStart={true} />
        );
        expect(getByText('Start')).toBeTruthy();

        rerender(
            <StartRideDisplay {...baseProps} devices={devicesHrmError} rideState="Starting" readyToStart={true} />
        );
        expect(getByText('Start')).toBeTruthy();
        expect(queryByText('Retry')).toBeNull();
        expect(queryByText('Ignore')).toBeNull();
    });

    it('keeps a failed sensor inline (no sensor-error dialog) even when rideState is Error', () => {
        const devices = [trainer('Started'), hrm('Error')];

        const { getByText, queryByText } = render(
            <StartRideDisplay {...baseProps} devices={devices} rideState="Error" readyToStart={true} />
        );

        expect(queryByText('Could not start Sensor(s)')).toBeNull();
        expect(getByText('Start')).toBeTruthy();
    });

    it('shows the device-error dialog for a failed control device', () => {
        const devices = [trainer('Error'), hrm('Starting')];
        const { getByText } = render(
            <StartRideDisplay {...baseProps} devices={devices} rideState="Error" readyToStart={false} />
        );

        expect(getByText('Start failed')).toBeTruthy();
        expect(getByText('Retry')).toBeTruthy();
    });

    // Street View-specific content, gated on `viewState`.
    describe('Street View start', () => {
        const make = (extra: Record<string, unknown>) => ({ ...baseProps, ...extra }) as unknown as StartRideDisplayProps;
        const streetView = {
            startPhase: 'content',
            startContent: { kind: 'streetview', label: 'Street View', state: 'loading' },
        };

        it('shows "Preparing Street View ..." and "Loading ..." while loading, no Start with Map yet', () => {
            const { getByText, queryByText } = render(
                <StartRideDisplay {...make({ ...streetView, rideState: 'Starting', readyToStart: false, viewState: 'loading' })} />
            );

            expect(getByText('Preparing Street View ...')).toBeTruthy();
            expect(getByText('Loading ...')).toBeTruthy();
            expect(queryByText('Start with Map')).toBeNull();
        });

        it('offers a Start with Map button once slow', () => {
            const onStartWithMap = jest.fn();
            const { getByText } = render(
                <StartRideDisplay
                    {...make({ ...streetView, rideState: 'Starting', readyToStart: false, viewState: 'slow', onStartWithMap })}
                />
            );

            expect(getByText('Preparing Street View ...')).toBeTruthy();

            fireEvent.press(getByText('Start with Map'));
            expect(onStartWithMap).toHaveBeenCalled();
        });

        it('does not offer Start with Map once unavailable', () => {
            const { queryByText } = render(
                <StartRideDisplay {...make({ startPhase: 'ready', rideState: 'Starting', readyToStart: true, viewState: 'unavailable' })} />
            );

            expect(queryByText('Start with Map')).toBeNull();
        });
    });
});
