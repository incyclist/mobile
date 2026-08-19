import { AppDisplayProps } from '../AppsSettings/types';

/** Smart wrapper's public props - `apps` is fetched internally from `AppsService`, not passed in. */
export interface AppsDialogProps {
    visible: boolean;
    onClose: () => void;
    renderApp?: (appKey: string, onBack: () => void, standalone: boolean) => React.ReactNode;
}

/** Pure view props (no `incyclist-services` dependency). */
export interface AppsDialogViewProps {
    visible: boolean;
    apps: AppDisplayProps[];
    onClose: () => void;
    renderApp?: (appKey: string, onBack: () => void, standalone: boolean) => React.ReactNode;
}