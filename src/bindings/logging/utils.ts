import { EventLogger } from "gd-eventlog";

const LOG_BLACKLIST = [
    'user',
    'auth',
    'cacheDir',
    'baseDir',
    'pageDir',
    'appDir',
];
EventLogger.setKeyBlackList(LOG_BLACKLIST);

export const restLogFilter = (context: string, event: object) => {
    let fl = fileLogFilter(context, event);
    return fl;
};

export const fileLogFilter = (context: string, event: object) => {
    if (event === undefined || context === undefined) return false;

    if (context === 'Requests' || context === 'RestLogAdapter') return false;

    return true;
};

export const MAX_DEPTH = 3;

export const isFunc = (o: any): boolean => {
    return typeof o === 'function';
};

export const isClass = (o: any): boolean => {
    return (
        isFunc(o) &&
        o.prototype !== undefined &&
        o.prototype.constructor !== undefined
    );
};

export const isSymbol = (o: any): boolean => {
    return typeof o === 'symbol';
};
