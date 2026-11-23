export interface RouteSharingChecklistProps {
    /** `reach`: a paired computer does not answer. `find`: the search found nothing. */
    variant: 'reach' | 'find';
    /** The computer's name; only used by the `reach` variant */
    name?: string;
    /** iOS: the Local Network permission may be the cause */
    showLocalNetworkHint: boolean;
    /** Shows the `Open iOS Settings` button below the hint (`reach` variant only) */
    onOpenSettings?: () => void;
}
