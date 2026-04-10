export interface AppDisplayProps {
    name: string;
    key: string;
    iconUrl: string;
    isConnected: boolean;
}

export interface AppsSettingsViewProps {
    apps?: AppDisplayProps[];
    onSelect?: (key: string) => void;
    compact?: boolean;
    onBack?: () => void;
}

export interface AppsSettingsProps {
    onBack?: () => void;
}