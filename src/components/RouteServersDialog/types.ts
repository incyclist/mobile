import type {
    RouteServersCloseReason,
    RouteServersOrigin,
    RouteServersSettingsDisplayProps,
} from 'incyclist-services';

/** Smart wrapper's public props: the display props come from the page service. */
export interface RouteServersDialogProps {
    /** where the user came from: 'settings' starts with the list, 'import' with the add view */
    origin: RouteServersOrigin;
    /**
     * called when the page service closes the page, with the reason it reports:
     * 'done' (server added from the Import dialog), 'back' (Back from the first view), 'cancel' (Close)
     */
    onClose: (reason: RouteServersCloseReason) => void;
}

/** Callbacks the view reports to its smart wrapper. */
export interface RouteServersActions {
    onClose: () => void;
    onBack: () => void;
    onShowAdd: () => void;
    onShowManualEntry: () => void;
    onAddKnown: (id: string) => void;
    onRetryKnown: (id: string) => void;
    onSetManualUrl: (url: string) => void;
    onSetManualName: (name: string) => void;
    onCheckAndAdd: () => void;
    onCheck: () => void;
    onAdd: () => void;
    onConfirmAddEmpty: () => void;
    onCancelAddEmpty: () => void;
    onRequestRemove: (key: string) => void;
    onSetRemoveRoutes: (remove: boolean) => void;
    onConfirmRemove: () => void;
    onCancelRemove: () => void;
}

/** Pure view props (no `incyclist-services` runtime dependency). */
export interface RouteServersDialogViewProps extends RouteServersActions {
    /** phone layout: one column, address check inline, name after the check */
    compact: boolean;
    displayProps: RouteServersSettingsDisplayProps;
    visible?: boolean;
}
