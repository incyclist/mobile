import { RouteImportDisplayProps } from 'incyclist-services'

export type DialogPhase = 'idle' | 'importing' | 'done';

export interface RouteImportProps  {
    imports? : RouteImportDisplayProps[]
}

export interface RouteImportDialogViewProps  {
    imports : RouteImportDisplayProps[]
    phase: DialogPhase
    onSelectFile: () => void
    onClose: () => void
}
