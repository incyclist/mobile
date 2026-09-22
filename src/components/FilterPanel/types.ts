export interface MinMax {
    min?: { value: number; unit: string };
    max?: { value: number; unit: string };
}
import { SearchFilter, SearchFilterOptions } from "incyclist-services";


export interface FilterPanelProps {
    filters: SearchFilter;
    options: SearchFilterOptions;
    visible: boolean;
    compact: boolean;
    onFilterChanged: (filters: SearchFilter) => void;
    onToggle: () => void;
    /** Count of routes matching the currently-applied filters, shown on the phone dialog's
     *  "Show N routes" footer button so the live result count stays visible while the panel
     *  covers the list. Not used on tablet, where the list stays visible behind the inline panel. */
    resultCount?: number;
}


export type {SearchFilter,SearchFilterOptions }
