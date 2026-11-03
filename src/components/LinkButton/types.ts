export interface LinkButtonProps {
    label: string;
    onPress: () => void;
    disabled?: boolean;
    /** adds a trailing arrow and tells screen readers that the link opens in the browser */
    external?: boolean;
}
