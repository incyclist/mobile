export type SecretsStatus = 'ok' | 'stale' | 'missing';

export type AppSecrets = Record<string, string>;

export interface CachedSecrets {
    secrets: AppSecrets;
    expiresAt: string;
    fetchedAt: string;
}