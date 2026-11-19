import { useFeatureToggleSync } from 'incyclist-services';
import { EventLogger } from 'gd-eventlog';
import { getSecretBinding } from './index';
import { getMessageQueueBinding } from '../mq';
import { getUserSettingsBinding } from '../user-settings';

/**
 * MQTT and the feature-toggle sync both check for credentials at the moment they are
 * started and do not look again. When secrets only become available later (a failed init
 * that succeeded on a background retry), they have to be started again explicitly.
 */
export const registerSecretsRecovery = () => {
    const logger = new EventLogger('Secrets');

    return getSecretBinding().onRecovered(() => {
        try {
            const uuid = getUserSettingsBinding().getValue('uuid', null);
            // no-op when already subscribed; subscribes (and requests a connect) otherwise
            useFeatureToggleSync().start(uuid);

            // also covers subscriptions that were deferred while there were no credentials
            getMessageQueueBinding().connect()
                .catch((err: any) => logger.logEvent({ message: 'error', fn: 'onRecovered', error: err?.message }));
        } catch (err: any) {
            logger.logEvent({ message: 'error', fn: 'onRecovered', error: err?.message });
        }
    });
};
