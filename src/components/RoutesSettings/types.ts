import type { IconName } from '../Icon/types';

export type RoutesCardKey = 'servers' | 'sharing';

export interface RoutesSettingsProps {
    onClose: () => void;
}

/** The one-line status a card shows under its description. */
export interface RoutesCardSummary {
    text: string;
    /** amber: something needs the rider's attention */
    warning?: boolean;
}

export interface RoutesCard {
    key: RoutesCardKey;
    title: string;
    description: string;
    icon: IconName;
    summary: RoutesCardSummary;
}

export interface RoutesSettingsViewProps {
    /** in display order */
    cards: RoutesCard[];
    /** Overrides the phone/tablet detection (used by stories and tests) */
    compact?: boolean;
    onOpenCard: (key: RoutesCardKey) => void;
    onClose: () => void;
}
