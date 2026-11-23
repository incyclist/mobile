import React, { useState, useEffect, useRef } from 'react';
import { Image, Platform, ImageProps } from 'react-native';
import { getFileSystemBinding } from '../../bindings/fs';
import { useLogging, useUnmountEffect } from '../../hooks';
import type { ThumbnailLinkSource } from 'incyclist-services';
import { useCachedThumbnail } from '../../hooks/thumbnail/useCachedThumbnail';

export type SecureImageProps = Omit<ImageProps, 'source'> & {
    /** Absent for a thumbnail that only a paired computer has: it is shown from the device once cached. */
    source?: ImageProps['source'];
    /**
     * Stable identity of the route this image is the thumbnail of. When set and the source is an
     * http(s) URL, the thumbnail is kept on the device permanently: shown from there if present,
     * otherwise fetched for next time while the original source is shown.
     */
    thumbnailRouteKey?: string;
    /** The paired computer (and handle) the thumbnail can be fetched from, as reported by the page service. */
    thumbnailLink?: ThumbnailLinkSource;
    /** Shown instead of the image when the thumbnail of a computer could not be fetched or displayed. */
    fallback?: React.ReactNode;
};

/**
 * SecureImage is a drop-in replacement for React Native's <Image> that handles
 * iOS security-scoped access for file:// URIs.
 *
 * On iOS, when source.uri starts with 'file://', it requests access via the
 * FileSystem binding before rendering the image, and releases access on unmount.
 * On all other platforms or for non-file URIs, it renders the standard Image component.
 */
export const SecureImage = (allProps: SecureImageProps) => {
    const { thumbnailRouteKey, thumbnailLink, fallback, ...props } = allProps;
    const { source } = props;
    const { logError } = useLogging('SecureImage');

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

        try {
            if (needsGate && !hasAccess && typeof uri === 'string') {
                getFileSystemBinding().requestAccess(uri)
                    .then((isGranted) => {
                        if (isGranted) {
                            setHasAccess(true);
                            refHasGrant.current = true;
                        }
                    })
                    .catch((err: any) => logError(err, 'SecureImage.requestAccess'));
            }
        }
        catch (err: any) {
            logError(err, 'SecureImage.requestAccess');
        }
    }, [needsGate, hasAccess, uri, logError]);

    useUnmountEffect(() => {
        try {
            if (refHasGrant.current && typeof uri === 'string') {
                getFileSystemBinding().releaseAccess(uri);
                refHasGrant.current = false;
            }
        }
        catch (err: any) {
            logError(err, 'SecureImage.releaseAccess');
        }
    });

    const { ready, cachedUri, failed, onCacheError } = useCachedThumbnail(thumbnailRouteKey, uri, thumbnailLink);

    if (!hasAccess || !ready) {
        return null;
    }

    if (cachedUri) {
        return <Image {...props} source={{ uri: cachedUri }} onError={onCacheError} />;
    }

    if (failed) {
        return <>{fallback ?? null}</>;
    }

    if (!props.source) {
        return null;
    }

    return <Image {...props} source={props.source} />;
};