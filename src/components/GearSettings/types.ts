import type { ICyclingMode, CyclingModeProperty, Settings } from 'incyclist-services';

export interface GearSettingsProps {
    onClose: () => void;
}

export interface GearSettingsViewProps {
    mode: string;
    options: ICyclingMode[];
    settings: Settings;
    properties: CyclingModeProperty[];
    onClose: () => void;
    onChangeMode: (mode: string) => void;
    onChangeSetting: (property: string, value: any) => void;
}