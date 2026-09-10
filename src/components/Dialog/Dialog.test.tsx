import React from 'react';
import { render } from '@testing-library/react-native';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as SafeAreaContext from 'react-native-safe-area-context';
import { EventLogger } from 'gd-eventlog';
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

    // App is landscape-locked, so the notch sits on left/right (whichever edge the current
    // rotation puts it on). Design intent (UX-reviewed): decorative pixels (the dialog's own
    // gradient/background) always run to the physical screen edge - the Modal is told to draw
    // under the cutout (statusBarTranslucent/navigationBarTranslucent) rather than let Android
    // auto-inset the window - and only the *content* (header, buttons) is padded away from it.
    // Padding is symmetric (max(left,right)), not directional: the header title and the
    // (centered) footer button bar would look optically off-balance if only the cutout side
    // were padded. An earlier version of this fix padded content AND let the OS auto-inset the
    // window, which doubled the inset - hence asserting both halves here, not just one.
    describe('safe-area insets', () => {
        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('lets the Modal window draw under the notch (no OS-level auto-inset) for both variants', () => {
            const { UNSAFE_root: fullRoot } = render(
                <Dialog title="Test Dialog" variant="full">
                    <Text>content</Text>
                </Dialog>
            );
            const fullModal = fullRoot.findByType(Modal);
            expect(fullModal.props.statusBarTranslucent).toBe(true);
            expect(fullModal.props.navigationBarTranslucent).toBe(true);

            const { UNSAFE_root: detailsRoot } = render(
                <Dialog title="Test Dialog" variant="details">
                    <Text>content</Text>
                </Dialog>
            );
            const detailsModal = detailsRoot.findByType(Modal);
            expect(detailsModal.props.statusBarTranslucent).toBe(true);
            expect(detailsModal.props.navigationBarTranslucent).toBe(true);
        });

        it('pads dialog content symmetrically by the larger of left/right, not directionally', () => {
            jest.spyOn(SafeAreaContext, 'useSafeAreaInsets').mockReturnValue({ top: 10, left: 24, right: 0, bottom: 34 });

            const { UNSAFE_root } = render(
                <Dialog title="Test Dialog" variant="full">
                    <Text>content</Text>
                </Dialog>
            );

            const container = UNSAFE_root.findAllByType(View).find((v: any) => {
                const flat = StyleSheet.flatten(v.props.style);
                return flat?.overflow === 'hidden';
            });

            expect(container).toBeTruthy();
            const flat = StyleSheet.flatten(container!.props.style);
            expect(flat.paddingLeft).toBe(24);
            expect(flat.paddingRight).toBe(24);
        });

        it('does not pad dialog if its not full', () => {
            jest.spyOn(SafeAreaContext, 'useSafeAreaInsets').mockReturnValue({ top: 10, left: 24, right: 0, bottom: 34 });

            const { UNSAFE_root } = render(
                <Dialog title="Test Dialog">
                    <Text>content</Text>
                </Dialog>
            );

            const container = UNSAFE_root.findAllByType(View).find((v: any) => {
                const flat = StyleSheet.flatten(v.props.style);
                return flat?.overflow === 'hidden';
            });

            expect(container).toBeTruthy();
            const flat = StyleSheet.flatten(container!.props.style);
            expect(flat.paddingLeft).toBe(0);
            expect(flat.paddingRight).toBe(0);
        });

        it('pads the full-variant content area symmetrically too', () => {
            jest.spyOn(SafeAreaContext, 'useSafeAreaInsets').mockReturnValue({ top: 0, left: 0, right: 28, bottom: 21 });

            const { UNSAFE_root } = render(
                <Dialog title="Test Dialog" variant="full">
                    <Text>content</Text>
                </Dialog>
            );

            const fullContentArea = UNSAFE_root.findAllByType(View).find((v: any) => {
                const flat = StyleSheet.flatten(v.props.style);
                return flat?.maxHeight === '100%' && flat?.borderRadius === 0;
            });

            expect(fullContentArea).toBeTruthy();
            const flat = StyleSheet.flatten(fullContentArea!.props.style);
            expect(flat.paddingLeft).toBe(28);
            expect(flat.paddingRight).toBe(28);
        });

        it('still surfaces the raw insets on the dialog-shown log event, for on-device diagnosis', () => {
            jest.spyOn(SafeAreaContext, 'useSafeAreaInsets').mockReturnValue({ top: 0, left: 24, right: 0, bottom: 0 });
            const logSpy = jest.spyOn(EventLogger.prototype, 'logEvent');

            render(
                <Dialog title="Test Dialog">
                    <Text>content</Text>
                </Dialog>
            );

            expect(logSpy).toHaveBeenCalledWith(expect.objectContaining({
                message: 'dialog shown',
                safeAreaLeft: 24,
                safeAreaRight: 0,
            }));
        });
    });
});
