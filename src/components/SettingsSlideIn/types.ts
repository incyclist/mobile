import { SettingsSectionItem } from '../../pages/SettingsPage/types';

export interface SettingsSlideInProps {
    visible: boolean;
    sections: SettingsSectionItem[];
    onClose: () => void;
    onSectionPress: (label: string) => void;
}