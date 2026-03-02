import React, { useRef, useState, useEffect, ReactElement } from 'react';
import { Observer } from 'incyclist-services';
import { useUnmountEffect } from '../../hooks';

interface DynamingMapping {
    event: string;
    prop: string;
}

export interface DynamicProps {
    observer?: Observer;
    event?: string;
    events?: string; // comma-separated event names
    prop?: string;
    mapping?: DynamingMapping[];
    onEvent?: (value: any) => void;
    transform?: (value: any) => any;
    hidden?: boolean;
    debugId?: string;
    children: ReactElement | ReactElement[];
    [key: string]: any; // additional props passed to child
}

const EXCLUDED_PROPS = [
    'mapping', 'observer', 'children',
    'hidden', 'event', 'events', 'transform', 'prop',
    'onEvent', 'debugId'
];

const copyPropsExcluding = (props: any, excluded: string[]) => {
    const result: any = {};
    Object.keys(props).forEach(key => {
        if (!excluded.includes(key)) result[key] = props[key];
    });
    return result;
};

export const Dynamic = (props: DynamicProps) => {
    const { 
        observer, event, events, prop, mapping, 
        onEvent, transform, hidden, children 
    } = props;

    const [dynamicProps, setDynamicProps] = useState<any>({});
    const initialized = useRef(false);
    const handlers = useRef<Array<{ event: string, handler: (data: any) => void }>>([]);

    useEffect(() => {
        if (!observer || initialized.current) return;

        const updateProp = (propName: string, value: any) => {
            const val = transform ? transform(value) : value;
            setDynamicProps((prev: any) => ({ ...prev, [propName]: val }));
        };

        // 1. Mapping array mode
        if (mapping && Array.isArray(mapping)) {
            mapping.forEach(m => {
                const handler = (data: any) => updateProp(m.prop, data);
                observer.on(m.event, handler);
                handlers.current.push({ event: m.event, handler });
            });
        }
        // 2. Comma-separated events + single prop mode
        else if (events && prop) {
            const eventList = events.split(',').map(e => e.trim());
            eventList.forEach(e => {
                const handler = (data: any) => updateProp(prop, data);
                observer.on(e, handler);
                handlers.current.push({ event: e, handler });
            });
        }
        // 3. Single event + prop mode
        else if (event && prop) {
            const handler = (data: any) => updateProp(prop, data);
            observer.on(event, handler);
            handlers.current.push({ event, handler });
        }
        // 4. Single event + callback mode
        else if (event && onEvent) {
            const handler = (data: any) => onEvent(data);
            observer.on(event, handler);
            handlers.current.push({ event, handler });
        }

        initialized.current = true;
    }, [observer, event, events, prop, mapping, onEvent, transform]);

    useUnmountEffect(() => {
        if (observer) {
            handlers.current.forEach(h => {
                try {
                    observer.off(h.event, h.handler);
                } catch {
                    console.error(`Dynamic: Failed to unsubscribe from ${h.event}`);
                }
            });
        }
    });

    const staticProps = copyPropsExcluding(props, EXCLUDED_PROPS);
    const extraStyle = hidden ? { opacity: 0 } : {};

    const renderChild = (child: ReactElement<any>) => {
        if (!child) return null;
        
        const childStyle = { ...((child.props as any).style ?? {}), ...extraStyle };
        
        return React.cloneElement(child, {
            ...staticProps,
            ...dynamicProps,
            style: childStyle
        });
    };

    return (
        <>
            {React.Children.map(children, (child) => 
                React.isValidElement(child) ? renderChild(child as ReactElement) : child
            )}
        </>
    );
};
