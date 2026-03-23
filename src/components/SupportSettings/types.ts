import { SupportSettingsDisplayProps } from 'incyclist-services';

export interface SupportSettingsViewProps {
    displayProps: SupportSettingsDisplayProps | null;
    onClose: () => void;
    onShareUuid: () => void;
    onOpenUrl: (url: string) => void;
}