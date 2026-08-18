import React from 'react';
import { render } from '@testing-library/react-native';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Dialog } from './Dialog';

const getSlotLabels = (root: any) =>
    root.findAllByType(TouchableOpacity)
        .map((n: any) => {
            const hidden = JSON.stringify(n.props.style).includes('"display":"none"');
            const texts = n.findAllByType(Text).map((t: any) => t.props.children);
            return hidden ? null : texts[0];
        })
        .filter((l: any) => l !== null && l !== '');

describe('Dialog', () => {
    it('wraps children in a ScrollView by default (scrollable=true)', () => {
        const { UNSAFE_root } = render(
            <Dialog title="Test Dialog">
                <Text>content</Text>
            </Dialog>
        );

        expect(UNSAFE_root.findAllByType(ScrollView).length).toBeGreaterThan(0);
    });

    it('renders children in a plain View (no ScrollView) when scrollable=false', () => {
        // Regression test: nesting a component that manages its own scrolling (e.g.
        // DeviceSelector's device list + fixed footer) inside Dialog's own ScrollView left the
        // inner scroll area's height undefined and caused nested-ScrollView gesture conflicts.
        // scrollable=false must render children directly, with no ScrollView ancestor from Dialog.
        const { UNSAFE_root } = render(
            <Dialog title="Test Dialog" scrollable={false}>
                <Text>content</Text>
            </Dialog>
        );

        expect(UNSAFE_root.findAllByType(ScrollView).length).toBe(0);
    });

    it('still renders the children content when scrollable=false', () => {
        const { getByText } = render(
            <Dialog title="Test Dialog" scrollable={false}>
                <View>
                    <Text>my content</Text>
                </View>
            </Dialog>
        );

        expect(getByText('my content')).toBeTruthy();
    });

    // FIXES_BACKLOG #52. The footer renders a fixed pool of button slots that are all mounted
    // from the first render, so a changing button set only updates props on views that already
    // exist. On iOS, React Native's new architecture does not lay out a view mounted into an
    // already-presented <Modal>, which left a newly added Start button invisible. Jest renders to
    // a JS tree and cannot exercise native mounting, so these guard the structure only - the
    // device is the real evidence.
    describe('button slots (FIXES_BACKLOG #52)', () => {
        const cancel = { id: 'cancel', label: 'Cancel', onClick: () => {} };
        const start = { id: 'start', label: 'Start', primary: true, onClick: () => {} };

        it('renders the updated button set when buttons change while open', () => {
            const { getByText, queryByText, rerender } = render(
                <Dialog title="Starting activity ..." buttons={[cancel]}>
                    <Text>content</Text>
                </Dialog>
            );

            expect(queryByText('Start')).toBeNull();

            rerender(
                <Dialog title="Starting activity ..." buttons={[start, cancel]}>
                    <Text>content</Text>
                </Dialog>
            );

            expect(getByText('Start')).toBeTruthy();
            expect(getByText('Cancel')).toBeTruthy();
        });

        it('keeps the same number of mounted slots as the button set grows', () => {
            const countSlots = (root: any) =>
                root.findAllByType(TouchableOpacity).length;

            const { UNSAFE_root, rerender } = render(
                <Dialog title="Starting activity ..." buttons={[cancel]}>
                    <Text>content</Text>
                </Dialog>
            );
            const before = countSlots(UNSAFE_root);

            rerender(
                <Dialog
                    title="Could not start Sensor(s)"
                    buttons={[
                        { id: 'retry', label: 'Retry', onClick: () => {} },
                        { id: 'ignore', label: 'Ignore', primary: true, onClick: () => {} },
                        cancel,
                    ]}
                >
                    <Text>content</Text>
                </Dialog>
            );

            // No slot was mounted to make room for the extra buttons - the count is unchanged,
            // which is the property that keeps the iOS defect unreachable.
            expect(countSlots(UNSAFE_root)).toBe(before);
            expect(getSlotLabels(UNSAFE_root)).toEqual(['Retry', 'Ignore', 'Cancel']);
        });

        it('hides unused slots rather than unmounting them', () => {
            const { UNSAFE_root } = render(
                <Dialog title="Starting activity ..." buttons={[cancel]}>
                    <Text>content</Text>
                </Dialog>
            );

            const hidden = UNSAFE_root.findAllByType(TouchableOpacity)
                .filter((n: any) => JSON.stringify(n.props.style).includes('"display":"none"'));
            expect(hidden.length).toBeGreaterThan(0);
        });
    });
});
