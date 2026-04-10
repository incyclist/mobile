import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Linking, TouchableOpacity, Button, StyleSheet, View } from 'react-native';
import { AppsOperation, useAppsService } from 'incyclist-services';
import { useLogging } from '../../hooks/logging';
import { useUnmountEffect } from '../../hooks/unmount';
import { AppSettingsView } from '../AppSettingsView';
import StravaConnect from '../../assets/apps/strava-connect.svg';
import { colors } from '../../theme/colors';
import { OAuthAppSettingsProps } from './types';

const OAUTH_BASE = 'https://auth.incyclist.com';
const REDIRECT_URI = 'incyclist://oauth/callback';

export const OAuthAppSettings = ({ appKey, onBack }: OAuthAppSettingsProps) => {
    const [isConnected, setIsConnected] = useState(false);
    const [operations, setOperations] = useState<AppsOperation[]>([]);
    const refInitialized = useRef(false);
    const refSubscription = useRef<{ remove: () => void } | null>(null);

    const service = useAppsService();
    const { logEvent, logError } = useLogging('OAuthAppSettings');

    const cleanupListener = useCallback(() => {
        if (refSubscription.current) {
            refSubscription.current.remove();
            refSubscription.current = null;
        }
    }, []);

    useUnmountEffect(cleanupListener, [cleanupListener]);

    const onCallback = useCallback(
        async ({ url }: { url: string }) => {
            if (!url.startsWith(REDIRECT_URI)) {
                return;
            }

            try {
                const parsed = new URL(url.replace('incyclist://', 'https://incyclist'));
                const error = parsed.searchParams.get('error');

                if (error) {
                    if (error !== 'aborted') {
                        logEvent({ message: 'oauth connect failed', appKey, error });
                    }
                    cleanupListener();
                    return;
                }

                const credentials = {
                    accesstoken: parsed.searchParams.get('accesstoken'),
                    refreshtoken: parsed.searchParams.get('refreshtoken'),
                    id: parsed.searchParams.get('id'),
                };

                const success = await service.connect(appKey, credentials);
                if (success) {
                    logEvent({ message: 'oauth connect success', appKey });
                    const updated = service.openAppSettings(appKey);
                    setIsConnected(updated.isConnected);
                    setOperations(updated.operations);
                } else {
                    logEvent({ message: 'oauth connect failed', appKey, error: 'Connection failed' });
                }
            } catch (err: any) {
                logError(err, 'onCallback');
                logEvent({ message: 'oauth connect failed', appKey, error: err.message });
            } finally {
                cleanupListener();
            }
        },
        [appKey, service, logEvent, logError, cleanupListener]
    );

    useEffect(() => {
        if (refInitialized.current) {
            return;
        }
        refInitialized.current = true;

        const state = service.openAppSettings(appKey);
        setIsConnected(state.isConnected);
        setOperations(state.operations);
    }, [appKey, service]);

    const onConnect = useCallback(() => {
        logEvent({ message: 'oauth connect start', appKey, eventSource: 'user' });
        const url = `${OAUTH_BASE}/${appKey}?sid=${encodeURIComponent(REDIRECT_URI)}`;

        cleanupListener();
        refSubscription.current = Linking.addEventListener('url', onCallback);
        Linking.openURL(url);
    }, [appKey, onCallback, logEvent, cleanupListener]);

    const onDisconnect = useCallback(async () => {
        await service.disconnect(appKey);
        setIsConnected(false);
        setOperations([]);
    }, [appKey, service]);

    const onOperationsChanged = useCallback(
        (operation: AppsOperation, enabled: boolean) => {
            const updatedOps = service.enableOperation(appKey, operation, enabled);
            setOperations(updatedOps);
        },
        [appKey, service]
    );

    const connectButton = useMemo(() => {
        if (appKey === 'strava') {
            return (
                <TouchableOpacity onPress={onConnect} style={styles.stravaButton}>
                    <StravaConnect width={159} height={31} />
                </TouchableOpacity>
            );
        }
        return (
            <View style={styles.intervalsButtonContainer}>
                <Button
                    title="Connect with Intervals.icu"
                    onPress={onConnect}
                    color={colors.buttonPrimary}
                />
            </View>
        );
    }, [appKey, onConnect]);

    const title = useMemo(() => (appKey === 'strava' ? 'Strava' : 'Intervals.icu'), [appKey]);

    return (
        <AppSettingsView
            title={title}
            isConnected={isConnected}
            operations={operations}
            onBack={onBack}
            onDisconnect={onDisconnect}
            onOperationsChanged={onOperationsChanged}
            connectButton={connectButton}
        />
    );
};

const styles = StyleSheet.create({
    stravaButton: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
    },
    intervalsButtonContainer: {
        paddingVertical: 8,
        minWidth: 220,
    },
});