import React from 'react';
import { EventLogger } from 'gd-eventlog';
import { ErrorBoundaryProps, ErrorBoundaryState } from './types';


export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    private logger: EventLogger;

    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { error: undefined };
        this.logger = new EventLogger('Incyclist');
    }

    static getDerivedStateFromError(err: Error): ErrorBoundaryState {
        return { error: err };
    }

    componentDidCatch(err: Error) {
        if (this.props.debug) {
            console.log('# error in component', err);
        }

        let component: string | undefined;
        if (!Array.isArray(this.props.children)) {
            const child = this.props.children as React.ReactElement;
            const type = child?.type;
            if (type && typeof type !== 'string') {
                component = (type as any).displayName ?? (type as React.ComponentType).name;
            }            
        }

        this.logger.logEvent({
            message: 'error in component',
            component,
            error: err.message,
            stack: err.stack,
        });
    }

    render() {
        if (this.state.error) {
            return null;
        }
        return this.props.children;
    }
}
