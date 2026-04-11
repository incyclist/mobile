import { AppDisplayProps } from '../AppsSettings/types';

export interface AppsDialogProps {
    visible: boolean;
    apps: AppDisplayProps[];
    onClose: () => void;
    renderApp?: (appKey: string, onBack: () => void, standalone: boolean) => React.ReactNode;
}