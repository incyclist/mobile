import type { ButtonProps } from '../ButtonBar/types';
import type { AddComputerScreen } from './utils';
import { getRetryLabel } from './utils';

export interface ScreenHandlers {
    onCancel: () => void;
    onSearchAgain: () => void;
    onRetry: () => void;
    onBack: () => void;
    onOpenIosSettings: () => void;
    onDone: () => void;
}

const cancel = (h: ScreenHandlers): ButtonProps => ({ label: 'Cancel', onClick: h.onCancel });

const getNoneButtons = (screen: Extract<AddComputerScreen, { kind: 'none' }>, h: ScreenHandlers): ButtonProps[] => {
    const buttons = [cancel(h)];
    if (screen.showLocalNetworkHint) buttons.push({ label: 'Open iOS Settings', onClick: h.onOpenIosSettings });
    buttons.push({ label: 'Search Again', onClick: h.onSearchAgain, primary: true });
    return buttons;
};

const getFailedButtons = (screen: Extract<AddComputerScreen, { kind: 'failed' }>, h: ScreenHandlers, seconds: number): ButtonProps[] => {
    const back: ButtonProps = { label: 'Back', onClick: h.onBack };
    if (screen.recovery === 'back') return [back];
    const waiting = screen.reason === 'rate-limited' && seconds > 0;
    return [
        back,
        { label: getRetryLabel(screen.recovery, screen.reason, seconds), onClick: h.onRetry, primary: true, disabled: waiting },
    ];
};

/** The footer buttons of a screen; none if the screen has no footer (code entry on a phone). */
export const getButtons = (screen: AddComputerScreen, h: ScreenHandlers, compact: boolean, seconds: number): ButtonProps[] | undefined => {
    switch (screen.kind) {
        case 'blocked':
            return [cancel(h), { label: 'Try Again', onClick: h.onSearchAgain, primary: true }];
        case 'none':
            return getNoneButtons(screen, h);
        case 'not-ready':
            return [{ label: 'Back', onClick: h.onBack }, { label: 'Try Again', onClick: h.onRetry, primary: true }];
        case 'code':
            return compact ? undefined : [cancel(h)];
        case 'failed':
            return getFailedButtons(screen, h, seconds);
        case 'connected':
            return [{ label: 'Done', onClick: h.onDone, primary: true }];
        default:
            return [cancel(h)];
    }
};
