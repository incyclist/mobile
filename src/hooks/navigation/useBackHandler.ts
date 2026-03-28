import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useLogging } from '../logging';
import type { NavigationAction } from '@react-navigation/native'; // Added for type safety in tests

export const useBackHandler = (service: { onBack?: () => boolean }): void => {
    const { logEvent } = useLogging('Navigation');
    const navigation = useNavigation();

    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', (e: {
            preventDefault: () => void;
            data: {
                action: NavigationAction;
            };
            target: string | undefined;
        }) => {
            logEvent({ message: 'back navigation pressed', eventSource: 'user' });
            const handled = service.onBack?.() ?? false;
            if (handled) {
                e.preventDefault();
            }
        });
        return unsubscribe;
    }, [navigation, service, logEvent]);
};