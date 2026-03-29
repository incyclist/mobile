const originalError = console.error.bind(console);
console.error = (...args: any[]) => {
    if (
        typeof args[0] === 'string' &&
        args[0].includes('was not wrapped in act')
    ) {
        return;
    }
    originalError(...args);
};