export interface ErrorBoundaryProps {
    children: React.ReactNode;
    debug?: boolean;
}

export interface ErrorBoundaryState {
    error: Error | undefined;
}
