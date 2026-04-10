export type OAuthAppKey = 'strava' | 'intervals';

export interface OAuthAppSettingsProps {
    appKey: OAuthAppKey;
    onBack?: () => void;
}