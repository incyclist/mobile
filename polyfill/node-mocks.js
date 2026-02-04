function MockBase() {}
MockBase.prototype.on = function() { return this; };
MockBase.prototype.off = function() { return this; };
MockBase.prototype.once = function() { return this; };
MockBase.prototype.removeAllListeners = function() { return this; };
MockBase.prototype.emit = function() { return this; };

// This Proxy as an export ensures that:
// import { AntChannel } from 'incyclist-ant-plus' -> returns MockBase
// import AntPlus from 'incyclist-ant-plus'       -> returns MockBase
const catchAll = new Proxy(MockBase, {
    get: (target, prop) => {
        if (prop === 'default' || prop === '__esModule') return target;
        return target; 
    }
});

module.exports = catchAll;


