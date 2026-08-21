import React from 'react';
import { render } from '@testing-library/react-native';
import { ScrollView, Text, View } from 'react-native';
import { Dialog } from './Dialog';
import { ButtonBar } from '../ButtonBar';

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

    // FIXES_BACKLOG #52. These guard the footer `key` that works around the RN new-architecture
    // iOS Modal defect (children added to a mounted subtree are never finalized/laid out until a
    // later commit). Jest renders to a JS tree and cannot exercise the native mounting path, so
    // this proves only that the footer remounts when the button set changes — not that the
    // workaround fixes the device symptom. Real-device iOS validation is the actual evidence.
    describe('footer remount on button-set change (FIXES_BACKLOG #52)', () => {
        it('renders the updated button set when buttons change while open', () => {
            const { getByText, queryByText, rerender } = render(
                <Dialog title="Starting activity ..." buttons={[{ id: 'cancel', label: 'Cancel', onClick: () => {} }]}>
                    <Text>content</Text>
                </Dialog>
            );

            expect(queryByText('Start')).toBeNull();

            rerender(
                <Dialog
                    title="Starting activity ..."
                    buttons={[
                        { id: 'start', label: 'Start', primary: true, onClick: () => {} },
                        { id: 'cancel', label: 'Cancel', onClick: () => {} },
                    ]}
                >
                    <Text>content</Text>
                </Dialog>
            );

            expect(getByText('Start')).toBeTruthy();
            expect(getByText('Cancel')).toBeTruthy();
        });

        it('remounts the footer subtree when the button ids change', () => {
            // Matches specifically the View wrapping <ButtonBar> (Dialog's `key={buttonSignature}`
            // footer) - not just "a View whose child has a `buttons` prop", which also matches
            // Dialog's own internal <DialogContent buttons={...}> element one level further out
            // (FIXES_BACKLOG.md item #63's Dialog duplication extraction introduced that prop).
            const footerOf = (root: any) =>
                root.findAllByType(View).find((v: any) => Array.isArray(v.props.children)
                    ? false
                    : v.props.children?.type === ButtonBar);

            const { UNSAFE_root, rerender } = render(
                <Dialog title="Starting activity ..." buttons={[{ id: 'cancel', label: 'Cancel', onClick: () => {} }]}>
                    <Text>content</Text>
                </Dialog>
            );

            const before = footerOf(UNSAFE_root);
            expect(before).toBeTruthy();

            rerender(
                <Dialog
                    title="Could not start Sensor(s)"
                    buttons={[
                        { id: 'retry', label: 'Retry', onClick: () => {} },
                        { id: 'ignore', label: 'Ignore', primary: true, onClick: () => {} },
                        { id: 'cancel', label: 'Cancel', onClick: () => {} },
                    ]}
                >
                    <Text>content</Text>
                </Dialog>
            );

            // A changed key means React discarded the old footer instance rather than reusing it.
            const after = footerOf(UNSAFE_root);
            expect(after).toBeTruthy();
            expect(after).not.toBe(before);
        });
    });
});
