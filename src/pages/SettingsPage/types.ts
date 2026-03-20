export type SettingsSectionItem = {
    label: string;
    onPress: () => void;
};

export interface SettingsPageViewProps {
    sections: SettingsSectionItem[];
    onClose: () => void;
}