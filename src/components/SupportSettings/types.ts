import type {
    DonationClickId,
    SupportLinkClickId,
    SupportSettingsDialogDisplayProps,
} from 'incyclist-services';

export interface SupportSettingsViewProps {
    displayProps: SupportSettingsDialogDisplayProps | null;
    /** Overrides the phone/tablet detection (used by stories and tests) */
    compact?: boolean;
    onClose: () => void;
    onShareUuid: () => void;
    /** Help links, privacy and other-help links. `id` identifies the link for logging */
    onOpenUrl: (url: string, id: SupportLinkClickId) => void;
    /** Donation channel buttons and the website link */
    onDonate: (id: DonationClickId, url: string) => void;
    /** Share the prefilled support email text (tablet only) */
    onShareDetails: () => void;
}
