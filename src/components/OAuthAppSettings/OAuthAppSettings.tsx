import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Linking, StyleSheet, TouchableOpacity } from 'react-native';
import { useAppsService } from 'incyclist-services';
import type { AppsOperation } from 'incyclist-services';
import { AppSettingsView } from '../AppSettingsView';
import type { OperationConfig } from '../OperationsSelector/types';
import { useLogging } from '../../hooks';
import { useUnmountEffect } from '../../hooks';
import { colors } from '../../theme/colors';
import { textSizes } from '../../theme/textSizes';
import StravaConnectSvg from '../../assets/apps/btn_strava_connectwith_orange.svg';
import type { OAuthAppSettingsProps } from './types';

const OAUTH_BASE = 'https://auth.incyclist.com';
const REDIRECT_URI = 'incyclist://oauth/callback';

const OAuthAppSettings = ({ appKey, onBack }: OAuthAppSettingsProps) => {
    const service = useAppsService();
    const { logEvent, logError } = useLogging('OAuthAppSettings');

    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [isConnecting, setIsConnecting] = useState<boolean>(false);
    const [operations, setOperations] = useState<OperationConfig[]>([]);

    const refInitialized = useRef<boolean>(false);
    const refLinkingSubscription = useRef<{ remove: () => void } | null>(null);

    const removeLinkingListener = useCallback(() => {
        if (refLinkingSubscription.current) {
            refLinkingSubscription.current.remove();
            refLinkingSubscription.current = null;
        }
    }, []);

    useEffect(() => {
        if (refInitialized.current || !service) return;
        refInitialized.current = true;

        const state = service.openAppSettings(appKey);
        if (state) {
            setIsConnected(state.isConnected ?? false);
            setOperations((state.operations as OperationConfig[]) ?? []);
        }
    }, [service, appKey]);

    useUnmountEffect(removeLinkingListener);

    const onConnect = useCallback(() => {
        if (!service) return;

        logEvent({ message: 'oauth connect start', appKey, eventSource: 'user' });
        setIsConnecting(true);

        const url = `${OAUTH_BASE}/${appKey}?sid=${encodeURIComponent(REDIRECT_URI)}`;

        Linking.openURL(url).catch((err: Error) => {
            logError(err, 'onConnect');
            setIsConnecting(false);
        });

        const subscription = Linking.addEventListener('url', async ({ url: callbackUrl }: { url: string }) => {
            if (!callbackUrl.startsWith('incyclist://oauth/callback')) return;

            removeLinkingListener();

            try {
                const parsed = new URL(callbackUrl.replace('incyclist://', 'https://incyclist'));
                const error = parsed.searchParams.get('error');

                if (error) {
                    logEvent({ message: 'oauth connect failed', appKey, error });
                    setIsConnecting(false);
                    return;
                }

                const credentials = {
                    accesstoken: parsed.searchParams.get('accesstoken'),
                    refreshtoken: parsed.searchParams.get('refreshtoken'),
                    id: parsed.searchParams.get('id'),
                };

                await service.connect(appKey, credentials);

                logEvent({ message: 'oauth connect success', appKey });

                const refreshed = service.openAppSettings(appKey);
                if (refreshed) {
                    setIsConnected(refreshed.isConnected ?? false);
                    setOperations((refreshed.operations as OperationConfig[]) ?? []);
                }
            } catch (err) {
                logError(err as Error, 'onConnectCallback');
                logEvent({ message: 'oauth connect failed', appKey, error: (err as Error).message });
            } finally {
                setIsConnecting(false);
            }
        });

        refLinkingSubscription.current = subscription;
    }, [service, appKey, logEvent, logError, removeLinkingListener]);

    const onDisconnect = useCallback(() => {
        if (!service) return;
        service.disconnect(appKey);
        setIsConnected(false);
        setOperations([]);
    }, [service, appKey]);

    const onOperationsChanged = useCallback(
        (operation: AppsOperation, enabled: boolean) => {
            if (!service) return;
            const updated = service.enableOperation(appKey, operation, enabled);
            setOperations((updated as OperationConfig[]) ?? []);
        },
        [service, appKey],
    );

    const stravaConnectButton = useCallback(
        () => (
            <TouchableOpacity onPress={onConnect}>
                <StravaConnectSvg />
            </TouchableOpacity>
        ),
        [onConnect],
    );

    const intervalsConnectButton = useCallback(
        () => (
            <TouchableOpacity onPress={onConnect} style={styles.intervalsButton}>
                {React.createElement(
                    require('react-native').Text,
                    { style: styles.intervalsButtonText },
                    'Connect with Intervals.icu',
                )}
            </TouchableOpacity>
        ),
        [onConnect],
    );

    const connectButton = appKey === 'strava' ? stravaConnectButton : intervalsConnectButton;

    const title = appKey === 'strava' ? 'Strava' : 'Intervals.icu';

    return (
        <AppSettingsView
            title={title}
            isConnected={isConnected}
            isConnecting={isConnecting}
            connectButton={connectButton}
            operations={operations}
            onDisconnect={onDisconnect}
            onOperationsChanged={onOperationsChanged}
            onBack={onBack}
        />
    );
};

const styles = StyleSheet.create({
    intervalsButton: {
        backgroundColor: colors.buttonPrimary,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 4,
        alignItems: 'center',
    },
    intervalsButtonText: {
        color: colors.text,
        fontSize: textSizes.normalText,
        fontWeight: '600',
    },
});

export { OAuthAppSettings };