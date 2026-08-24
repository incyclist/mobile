import React from 'react';
import { render } from '@testing-library/react-native';
import Svg, { Path } from 'react-native-svg';
import { RiderAvatarMarker } from './RiderAvatarMarker';
import { MALE_AVATAR_PATHS, AVATAR_DEFAULT_COLORS } from '../../assets/avatars/male-paths';

// Query at the react-native-svg *component* level (not the underlying host component) so the
// `fill`/`viewBox` props reflect what RiderAvatarMarker actually passed in, before react-native-svg's
// internal color/geometry processing turns them into host-level payloads.
const findPaths = (root: ReturnType<typeof render>['UNSAFE_root']) =>
    root.findAllByType(Path);

describe('RiderAvatarMarker', () => {
    it('renders without crashing and draws every avatar path', () => {
        const { UNSAFE_root, toJSON } = render(<RiderAvatarMarker />);
        expect(toJSON()).not.toBeNull();
        expect(findPaths(UNSAFE_root).length).toBe(MALE_AVATAR_PATHS.length);
    });

    it('applies default colors when no avatar config is given', () => {
        const { UNSAFE_root } = render(<RiderAvatarMarker />);
        const shirtPathDef = MALE_AVATAR_PATHS.find(p => p.fillKey === 'shirt')!;
        const shirtPath = findPaths(UNSAFE_root).find(node => node.props.d === shirtPathDef.d);
        expect(shirtPath?.props.fill).toBe(AVATAR_DEFAULT_COLORS.shirt);
    });

    it('applies overridden colors from the avatar prop', () => {
        const { UNSAFE_root } = render(<RiderAvatarMarker avatar={{ shirt: '#ABCDEF' }} />);
        const shirtPathDef = MALE_AVATAR_PATHS.find(p => p.fillKey === 'shirt')!;
        const shirtPath = findPaths(UNSAFE_root).find(node => node.props.d === shirtPathDef.d);
        expect(shirtPath?.props.fill).toBe('#ABCDEF');
    });

    it('applies a helmet override only to helmOuter paths, leaving other fills untouched', () => {
        const { UNSAFE_root } = render(<RiderAvatarMarker avatar={{ helmet: '#112233' }} />);
        const paths = findPaths(UNSAFE_root);

        MALE_AVATAR_PATHS.filter(p => p.fillKey === 'helmOuter').forEach(pathDef => {
            const node = paths.find(n => n.props.d === pathDef.d);
            expect(node?.props.fill).toBe('#112233');
        });

        const shirtPathDef = MALE_AVATAR_PATHS.find(p => p.fillKey === 'shirt')!;
        const shirtPath = paths.find(node => node.props.d === shirtPathDef.d);
        expect(shirtPath?.props.fill).toBe(AVATAR_DEFAULT_COLORS.shirt);
    });

    it('derives marker width from the avatar viewBox aspect ratio for a given size', () => {
        const { UNSAFE_root } = render(<RiderAvatarMarker size={40} />);
        const svg = UNSAFE_root.findAllByType(Svg)[0];
        expect(svg.props.height).toBe(40);
        expect(svg.props.width).toBeGreaterThan(0);
        expect(svg.props.viewBox).toBe('0 0 2400 3394.29');
    });
});
