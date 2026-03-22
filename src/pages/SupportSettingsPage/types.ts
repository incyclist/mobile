import { SupportSettingsDisplayProps } from 'incyclist-services';

export interface SupportSettingsViewProps {
    displayProps: SupportSettingsDisplayProps | null;
    onBack: () => void;
    onShareUuid: () => void;
    onOpenUrl: (url: string) => void;
}