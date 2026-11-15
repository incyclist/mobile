import type { AppsOperation } from 'incyclist-services';

export interface OAuthAppSettingsProps {
    /** Key of the app as provided by the AppsService (e.g. 'strava', 'intervals', 'trainingpeaks') */
    appKey: string;
    /** Display name of the app, as provided by the AppsService. Falls back to the key */
    name?: string;
    onBack?: () => void;
}

export type { AppsOperation };