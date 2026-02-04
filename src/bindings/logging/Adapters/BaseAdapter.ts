import LogAdapter, {RawEvent} from '../LogAdapter';
import {MAX_DEPTH, isClass, isFunc, isSymbol} from '../utils';

export interface Props {
    depth?: number;
}

export default class BaseAdapter implements LogAdapter {
    public props: Props;

    constructor(props?: Props) {
        this.props = props ?? {};
    }

    toStr(o: any, depth: number = 0): string {
        let str: string = '';

        if (o === null) {
            return 'null';
        }
        if (depth >= MAX_DEPTH) {
            return '{...}';
        }
        if (isClass(o)) {
            return 'class ' + o.name;
        }
        if (isFunc(o)) {
            return '';
        }
        if (isSymbol(o)) {
            return o.toString();
        }

        let keys = Object.keys(o);
        let values = Object.values(o) as any;
        let value: string;
        let self = this;

        if (Array.isArray(o) && o.length === keys.length) {
            value = o
                .map(v =>
                    typeof v === 'object'
                        ? self.toStr(v, depth + 1)
                        : typeof v !== 'string'
                        ? v
                        : "'" + v + "'"
                )
                .join(',');
            str = '[' + value + ']';
            return str;
        }

        keys.forEach((key, i) => {
            if (isClass(values[i])) {
                value = 'class ' + values[i].name;
            } else if (isFunc(values[i])) {
                return '';
            } else if (isSymbol(values[i])) {
                value = values[i].toString();
            } else if (typeof values[i] === 'object') {
                value = self.toStr(values[i], depth + 1);
            } else if (typeof values[i] === 'string') {
                value = "'" + values[i] + "'";
            } else {
                value = values[i];
            }
            if (str.length > 0) {
                str += ',';
            }
            str += key + ':' + value;
        });
        return '{' + str + '}';
    }

    generateLog(
        contextName: string,
        rawEvent: any,
        raw?: RawEvent
    ): {str: string; logs: string[]} {
        let event = rawEvent;

        try {
            if (!!raw && this.props.depth !== undefined) {
                let {data} = raw.context?.get(raw.event, this.props.depth) ?? {};
                event = data ?? {};
                event.context = contextName;
            }

            let ts;
            let message;
            let str = '';
            let logs: string[] = [];
            let self = this;

            let key;
            for (key in event) {
                if (key === 'ts') {
                    ts = event[key];
                } else if (key === 'message') {
                    message = event[key];
                } else {
                    if (isClass(event[key])) {
                        logs.push(key + ':class ' + event[key].name);
                    } else if (isFunc(event[key])) {
                        // skip
                    } else if (typeof event[key] === 'object') {
                        logs.push(key + ':' + self.toStr(event[key]));
                    } else if (typeof event[key] === 'string') {
                        logs.push(key + ':' + ("'" + event[key] + "'"));
                    } else {
                        logs.push(key + ':' + event[key]);
                    }
                }
            }

            if (ts !== undefined) {
                str += ts;
            }
            if (str.length > 0) {
                str += '\t';
            }
            str += contextName;
            str += '\t' + message;

            return {str, logs};
        } catch (err) {
            const error = err as Error;
            return {str: 'Error', logs: [error.toString()]};
        }
    }
    /* istanbul ignore next */
    log(_context: string, _event: any): void {
        // to be implemeted
    }
}
