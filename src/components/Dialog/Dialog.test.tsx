import React from 'react';
import { render } from '@testing-library/react-native';
import { ScrollView, Text, View } from 'react-native';
import { Dialog } from './Dialog';

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

    // aboveContent renders as a non-scrolling sibling between the header and the scrollable
    // content (RouteDetailsDialog uses this for a compact-mode info bar/error message that must
    // always be visible before the user scrolls into the form/map below it) - verify it renders
    // and appears before `children` in document order, in both the default and 'full' variants.
    it('renders aboveContent before children (default variant)', () => {
        const { getByText, UNSAFE_root } = render(
            <Dialog title="Test Dialog" aboveContent={<Text>above content</Text>}>
                <Text>children content</Text>
            </Dialog>
        );

        expect(getByText('above content')).toBeTruthy();
        expect(getByText('children content')).toBeTruthy();

        const texts = UNSAFE_root.findAllByType(Text).map(t => t.props.children);
        expect(texts.indexOf('above content')).toBeLessThan(texts.indexOf('children content'));
    });

    it('renders aboveContent before children (variant="full")', () => {
        const { getByText, UNSAFE_root } = render(
            <Dialog title="Test Dialog" variant="full" aboveContent={<Text>above content</Text>}>
                <Text>children content</Text>
            </Dialog>
        );

        expect(getByText('above content')).toBeTruthy();
        expect(getByText('children content')).toBeTruthy();

        const texts = UNSAFE_root.findAllByType(Text).map(t => t.props.children);
        expect(texts.indexOf('above content')).toBeLessThan(texts.indexOf('children content'));
    });
});
