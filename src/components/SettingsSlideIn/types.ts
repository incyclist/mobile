
export type SettingsSectionItem = {
    label: string;
    onPress: () => void;
};

export interface SettingsPageViewProps {
    sections: SettingsSectionItem[];
    onClose: () => void;
}
export interface SettingsSlideInProps {
    visible: boolean;
    sections: SettingsSectionItem[];
    onClose: () => void;
    onSectionPress: (label: string) => void;
}