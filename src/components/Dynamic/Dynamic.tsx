import React, { useRef, useState, useEffect, ReactElement } from 'react';
import { StyleSheet } from 'react-native';
import { IObserver } from 'incyclist-services';
import { useUnmountEffect } from '../../hooks';

const HIDDEN_STYLE = { opacity: 0 };

interface DynamingMapping {
    event: string;
    prop: string;
}

export interface DynamicProps {
    observer?: IObserver;
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

    const renderChild = (child: ReactElement<any>) => {
        if (!child) return null;

        // Pass the child's own style through untouched unless something has to be merged into
        // it: a fresh object on every render changes the prop identity, which defeats any
        // React.memo on the child and makes render tracing useless. flatten() (rather than an
        // array) keeps the result a plain object, which not every child tolerates as an array.
        const ownStyle = (child.props as any).style;
        const childStyle = hidden
            ? StyleSheet.flatten([ownStyle, HIDDEN_STYLE])
            : ownStyle;

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
