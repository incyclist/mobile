const createDownloadTask = (_opts: unknown) => ({
    begin: function (this: any, _cb: unknown) {
        return this;
    },
    progress: function (this: any, _cb: unknown) {
        return this;
    },
    done: function (this: any, _cb: unknown) {
        return this;
    },
    error: function (this: any, _cb: unknown) {
        return this;
    },
    stop: () => {},
});

const getExistingDownloadTasks = () => [];

const directories = { documents: '/mock/documents' };

export { createDownloadTask, getExistingDownloadTasks, directories };