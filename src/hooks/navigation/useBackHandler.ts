import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useLogging } from '../logging';

export const useBackHandler = (service: { onBack?: () => boolean }): void => {
    const { logEvent } = useLogging('Navigation');
    const navigation = useNavigation();

    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', (e) => {
            logEvent({ message: 'back navigation pressed', eventSource: 'user' });
            const handled = service.onBack?.() ?? false;
            if (handled) {
                e.preventDefault();
            }
        });
        return unsubscribe;
    }, [navigation, service, logEvent]);
};