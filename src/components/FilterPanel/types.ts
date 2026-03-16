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
}


export type {SearchFilter,SearchFilterOptions }
