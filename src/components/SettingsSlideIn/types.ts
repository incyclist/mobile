export interface SettingsSectionItem {
    label: string;
    onPress: () => void;
}

export interface SettingsSlideInProps {
    visible: boolean;
    sections: SettingsSectionItem[];
    onClose: () => void;
    onSectionPress: (label: string) => void;
}