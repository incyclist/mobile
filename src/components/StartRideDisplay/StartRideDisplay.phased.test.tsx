import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { StartRideDisplay } from './StartRideDisplay';
import { StartDeviceInfo, StartRideDisplayProps } from './types';

const noop = () => {};

const trainer = (extra: Partial<StartDeviceInfo> = {}): StartDeviceInfo => ({
    udid: 'trainer-1', name: 'KICKR CORE', isControl: true, status: 'Started', capabilities: ['control'],
    startState: 'started', ...extra,
});

const hrm = (extra: Partial<StartDeviceInfo> = {}): StartDeviceInfo => ({
    udid: 'hrm-1', name: 'HRM-Pro', isControl: false, status: 'Starting', capabilities: ['heartrate'],
    startState: 'starting', ...extra,
});

const make = (extra: Record<string, unknown> = {}) => ({
    mode: 'Free-Ride',
    rideState: 'Starting',
    readyToStart: false,
    devices: [trainer(), hrm()],
    startPhase: 'devices',
    onStart: noop,
    onRetry: noop,
    onCancel: noop,
    ...extra,
}) as unknown as StartRideDisplayProps;

describe('StartRideDisplay (phased)', () => {
    describe('phase heading', () => {
        it('shows the devices heading', () => {
            const { getByText } = render(<StartRideDisplay {...make({ devices: [trainer({ startState: 'starting', status: 'Starting' })] })} />);
            expect(getByText('Starting devices ...')).toBeTruthy();
        });

        it.each([
            ['map', 'Map', 'Loading map ...'],
            ['satellite', 'Satellite', 'Loading map ...'],
            ['streetview', 'Street View', 'Preparing Street View ...'],
            ['video', 'Video', 'Loading video ...'],
        ])('shows the content heading for %s', (kind, label, heading) => {
            const props = make({ startPhase: 'content', startContent: { kind, label, state: 'loading' } });
            const { getByText } = render(<StartRideDisplay {...props} />);
            expect(getByText(heading)).toBeTruthy();
        });

        it('shows "Preparing video ..." while an AVI is converted', () => {
            const props = make({
                startPhase: 'content',
                startContent: { kind: 'video', label: 'Video', state: 'loading', progress: { convertPct: 42 } },
            });
            const { getByText } = render(<StartRideDisplay {...props} />);
            expect(getByText('Preparing video ...')).toBeTruthy();
            expect(getByText('Preparing (42%)')).toBeTruthy();
        });

        it('shows the ready heading with Start as button', () => {
            const props = make({ startPhase: 'ready', readyToStart: true });
            const { getByText } = render(<StartRideDisplay {...props} />);
            expect(getByText('Ready to ride')).toBeTruthy();
            expect(getByText('Start')).toBeTruthy();
            expect(getByText('Cancel')).toBeTruthy();
        });
    });

    describe('line slot', () => {
        it('prefers the slow line over the AVI line', () => {
            const props = make({
                startPhase: 'content', startSlow: true,
                startContent: { kind: 'video', label: 'Video', state: 'loading', progress: { convertPct: 10 } },
            });
            const { getByTestId } = render(<StartRideDisplay {...props} />);
            expect(getByTestId('start-line').props.children).toBe('This is taking longer than usual.');
        });

        it('shows the notice instead of a line in the ready phase', () => {
            const props = make({
                startPhase: 'ready', startSlow: true, readyToStart: true,
                startReadyInfo: { pendingSensors: ['HRM-Pro'], notConnectedSensors: [], viewFallback: false },
            });
            const { queryByTestId, getByTestId } = render(<StartRideDisplay {...props} />);
            expect(queryByTestId('start-line')).toBeNull();
            expect(getByTestId('start-notice')).toBeTruthy();
        });

        it('shows the AVI expectation line when not slow', () => {
            const props = make({
                startContent: { kind: 'video', label: 'Video', state: 'loading', progress: { convertPct: 10 } },
            });
            const { getByTestId } = render(<StartRideDisplay {...props} />);
            expect(getByTestId('start-line').props.children).toMatch(/has to be prepared/);
        });

        it.each([
            [{ pendingSensors: ['HRM-Pro'], notConnectedSensors: [], viewFallback: false }, 'Heart rate sensor is still connecting'],
            [{ pendingSensors: [], notConnectedSensors: ['HRM-Pro'], viewFallback: false }, "Heart rate sensor isn't connected"],
            [{ pendingSensors: ['A'], notConnectedSensors: ['B'], viewFallback: false }, "2 sensors aren't connected yet"],
            [{ pendingSensors: [], notConnectedSensors: [], viewFallback: true }, "Street View isn't available right now"],
        ])('shows the ready notice %#', (info, title) => {
            const props = make({ startPhase: 'ready', readyToStart: true, startReadyInfo: info });
            const { getByTestId } = render(<StartRideDisplay {...props} />);
            expect(getByTestId('start-notice-title').props.children).toBe(title);
        });

        it('renders no line when there is nothing to say', () => {
            const { queryByTestId } = render(<StartRideDisplay {...make()} />);
            expect(queryByTestId('start-line')).toBeNull();
        });
    });

    describe('rows', () => {
        it('orders trainer, content, divider, then sensors', () => {
            const props = make({
                startPhase: 'content',
                devices: [hrm(), trainer()],
                startContent: { kind: 'map', label: 'Map', state: 'loading' },
            });
            const { toJSON, getByTestId } = render(<StartRideDisplay {...props} />);
            const json = JSON.stringify(toJSON());
            const pos = (id: string) => json.indexOf(id);
            expect(getByTestId('start-optional-divider')).toBeTruthy();
            expect(pos('start-row-trainer-1')).toBeLessThan(pos('start-row-content'));
            expect(pos('start-row-content')).toBeLessThan(pos('start-optional-divider'));
            expect(pos('start-optional-divider')).toBeLessThan(pos('start-row-hrm-1'));
        });

        it('omits the divider and the content row without sensors / content', () => {
            const { queryByTestId } = render(<StartRideDisplay {...make({ devices: [trainer()] })} />);
            expect(queryByTestId('start-optional-divider')).toBeNull();
            expect(queryByTestId('start-row-content')).toBeNull();
        });

        it('shows glyph and text for each device state', () => {
            const props = make({
                devices: [
                    trainer(),
                    hrm({ udid: 's1', name: 'S1', startState: 'not-connected', status: 'Error' }),
                    hrm({ udid: 's2', name: 'S2', startState: 'ignored' }),
                    hrm({ udid: 's3', name: 'S3', startState: 'starting', slow: true }),
                    hrm({ udid: 's4', name: 'S4', startState: 'uploading', stateText: 'Uploading (42%)' }),
                ],
            });
            const { getByText } = render(<StartRideDisplay {...props} />);
            expect(getByText('Started')).toBeTruthy();
            expect(getByText('Not connected')).toBeTruthy();
            expect(getByText('Ignored')).toBeTruthy();
            expect(getByText('Still starting ...')).toBeTruthy();
            expect(getByText('Uploading (42%)')).toBeTruthy();
        });

        it('uses amber for "Not connected" and muted for "Ignored"', () => {
            const props = make({
                devices: [
                    trainer(),
                    hrm({ udid: 's1', startState: 'not-connected', status: 'Error' }),
                    hrm({ udid: 's2', startState: 'ignored' }),
                ],
            });
            const { getByText } = render(<StartRideDisplay {...props} />);
            expect(JSON.stringify(getByText('Not connected').props.style)).toContain('#f5a623');
            expect(JSON.stringify(getByText('Ignored').props.style)).toContain('#9fa4a8');
        });
    });

    describe('row actions', () => {
        it('calls back with the udid of the row', () => {
            const onRetryDevice = jest.fn();
            const onIgnoreDevice = jest.fn();
            const props = make({
                devices: [trainer(), hrm({ canRetry: true, canIgnore: true })],
                onRetryDevice, onIgnoreDevice,
            });
            const { getByLabelText } = render(<StartRideDisplay {...props} />);

            fireEvent.press(getByLabelText('Retry HRM-Pro'));
            fireEvent.press(getByLabelText('Ignore HRM-Pro'));

            expect(onRetryDevice).toHaveBeenCalledWith('hrm-1');
            expect(onIgnoreDevice).toHaveBeenCalledWith('hrm-1');
        });

        it('only renders the actions the device allows', () => {
            const props = make({
                devices: [trainer({ canRetry: true, canIgnore: false }), hrm()],
                onRetryDevice: noop, onIgnoreDevice: noop,
            });
            const { queryByLabelText } = render(<StartRideDisplay {...props} />);
            expect(queryByLabelText('Retry KICKR CORE')).toBeTruthy();
            expect(queryByLabelText('Ignore KICKR CORE')).toBeNull();
            expect(queryByLabelText('Retry HRM-Pro')).toBeNull();
        });

        it('hides actions when no handler is wired', () => {
            const props = make({ devices: [trainer(), hrm({ canRetry: true, canIgnore: true })] });
            const { queryByLabelText } = render(<StartRideDisplay {...props} />);
            expect(queryByLabelText('Retry HRM-Pro')).toBeNull();
        });
    });

    describe('screen precedence', () => {
        it('keeps the device-error screen for a failed trainer', () => {
            const props = make({ rideState: 'Error', devices: [trainer({ status: 'Error', startState: 'failed' })] });
            const { getByText } = render(<StartRideDisplay {...props} />);
            expect(getByText('Start failed')).toBeTruthy();
        });

        it('does not switch to the sensor-error screen, the sensor is shown inline', () => {
            const props = make({
                rideState: 'Error', startPhase: 'ready', readyToStart: true,
                devices: [trainer(), hrm({ status: 'Error', startState: 'not-connected' })],
            });
            const { queryByText, getByText } = render(<StartRideDisplay {...props} />);
            expect(queryByText('Could not start Sensor(s)')).toBeNull();
            expect(getByText('Not connected')).toBeTruthy();
        });
    });
});
