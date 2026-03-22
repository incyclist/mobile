export const PERMISSIONS = {
    ANDROID: {},
    IOS: {},
};

export const RESULTS = {
    UNAVAILABLE: 'unavailable',
    DENIED: 'denied',
    GRANTED: 'granted',
    BLOCKED: 'blocked',
    LIMITED: 'limited',
};

export const request = () => Promise.resolve(RESULTS.GRANTED);
export const check = () => Promise.resolve(RESULTS.GRANTED);
export const requestMultiple = () => Promise.resolve({});
export const checkMultiple = () => Promise.resolve({});