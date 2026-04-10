import { AppDisplayProps } from '../AppsSettings/types';

export interface AppsSlideInProps {
    visible: boolean;
    apps?: AppDisplayProps[];
    offsetX: number;
    onSelect?: (key: string) => void;
    onClose?: () => void;
}