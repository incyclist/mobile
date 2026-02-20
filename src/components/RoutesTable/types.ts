import type { RouteItemProps } from "incyclist-services";

export interface RoutesTableProps {
    routes: Array<RouteItemProps>;
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
}

