import type { AppsOperation } from 'incyclist-services';

export type OAuthAppKey = 'strava' | 'intervals';

export interface OAuthAppSettingsProps {
    appKey: OAuthAppKey;
    onBack?: () => void;
}

export type { AppsOperation };