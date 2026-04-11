import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Linking, StyleSheet, TouchableOpacity } from 'react-native';
import InAppBrowser from 'react-native-inappbrowser-reborn';
import { useAppsService } from 'incyclist-services';
import type { AppsOperation } from 'incyclist-services';
import { AppSettingsView } from '../AppSettingsView';
import type { OperationConfig } from '../OperationsSelector/types';
import { useLogging } from '../../hooks';
import { colors } from '../../theme/colors';
import { textSizes } from '../../theme/textSizes';
import StravaConnectSvg from '../../assets/btn_strava_connectwith_orange.svg';
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
    const refStateParam = useRef<string>('');

    useEffect(() => {
        if (refInitialized.current || !service) return;
        refInitialized.current = true;

        const state = service.openAppSettings(appKey);
        if (state) {
            setIsConnected(state.isConnected ?? false);
            setOperations((state.operations as OperationConfig[]) ?? []);
        }
    }, [service, appKey]);

    const onConnect = useCallback(async () => {
        if (!service) return;

        const stateParam = Math.random().toString(36).substring(2);
        refStateParam.current = stateParam;

        logEvent({ message: 'oauth connect start', appKey, eventSource: 'user' });
        setIsConnecting(true);

        const url = `${OAUTH_BASE}/${appKey}?sid=${encodeURIComponent(REDIRECT_URI)}&state=${stateParam}`;

        try {
            const isAvailable = await InAppBrowser.isAvailable();
            if (!isAvailable) {
                // Fallback: open system browser, user must return manually
                await Linking.openURL(url);
                setIsConnecting(false);
                return;
            }

            const result = await InAppBrowser.openAuth(url, REDIRECT_URI, {
                showTitle: false,
                enableUrlBarHiding: true,
                enableDefaultShare: false,
                forceCloseOnRedirection: false,
                headers: { 'stateKey': stateParam },
            });

            if (result.type === 'cancel') {
                return;
            }

            if (result.type !== 'success' || !result.url) {
                return;
            }

            const callbackUrl = result.url;
            const parsed = new URL(callbackUrl.replace('incyclist://', 'https://incyclist'));
            const returnedState = parsed.searchParams.get('state');

            if (returnedState !== refStateParam.current) {
                logEvent({ message: 'oauth state mismatch', appKey });
                return;
            }

            const error = parsed.searchParams.get('error');
            if (error) {
                logEvent({ message: 'oauth connect failed', appKey, error });
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
            logError(err as Error, 'onConnect');
        } finally {
            setIsConnecting(false);
        }
    }, [service, appKey, logEvent, logError]);

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