export interface MinMax {
    min?: { value: number; unit: string };
    max?: { value: number; unit: string };
}
import { SearchFilter } from "incyclist-services";

export interface SearchFilterOptions {
    countries: Array<string>;
    contentTypes: Array<string>;
    routeTypes: Array<string>;
    routeSources: Array<string>;
    maxDistance?: { value: number; unit: string };
    maxElevation?: { value: number; unit: string };
}

export interface FilterPanelProps {
    filters: SearchFilter;
    options: SearchFilterOptions;
    visible: boolean;
    compact: boolean;
    onFilterChanged: (filters: SearchFilter) => void;
    onToggle: () => void;
}


export type {SearchFilter }
