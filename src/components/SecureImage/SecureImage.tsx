import React, { useState, useEffect, useRef } from 'react';
import { Image, Platform, ImageProps } from 'react-native';
import { getFileSystemBinding } from '../../bindings/fs';
import { useUnmountEffect } from '../../hooks';

export type SecureImageProps = ImageProps;

/**
 * SecureImage is a drop-in replacement for React Native's <Image> that handles
 * iOS security-scoped access for file:// URIs.
 *
 * On iOS, when source.uri starts with 'file://', it requests access via the
 * FileSystem binding before rendering the image, and releases access on unmount.
 * On all other platforms or for non-file URIs, it renders the standard Image component.
 */
export const SecureImage = (props: SecureImageProps) => {
    const { source } = props;

    const uri = typeof source === 'object' && !Array.isArray(source)
        ? (source as { uri?: string }).uri
        : undefined;

    const needsGate = Platform.OS === 'ios'
        && typeof uri === 'string'
        && uri.startsWith('file://');

    const [hasAccess, setHasAccess] = useState(!needsGate);
    const refHasGrant = useRef(false);
    const refInitialized = useRef(false);

    useEffect(() => {
        if (refInitialized.current) {
            return;
        }
        refInitialized.current = true;

        if (needsGate && !hasAccess && typeof uri === 'string') {
            getFileSystemBinding().requestAccess(uri)
                .then((isGranted) => {
                    if (isGranted) {
                        setHasAccess(true);
                        refHasGrant.current = true;
                    }
                });
        }
    }, [needsGate, hasAccess, uri]);

    useUnmountEffect(() => {
        if (refHasGrant.current && typeof uri === 'string') {
            getFileSystemBinding().releaseAccess(uri);
            refHasGrant.current = false;
        }
    });

    if (!hasAccess) {
        return null;
    }

    return <Image {...props} />;
};