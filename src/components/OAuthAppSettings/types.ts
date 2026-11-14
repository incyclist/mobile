import type { AppsOperation } from 'incyclist-services';

/** Key of an app as provided by the AppsService (e.g. 'strava', 'intervals', 'trainingpeaks') */
export type OAuthAppKey = string;

export interface OAuthAppSettingsProps {
    appKey: OAuthAppKey;
    /** Display name of the app, as provided by the AppsService. Falls back to the key */
    name?: string;
    onBack?: () => void;
}

export type { AppsOperation };