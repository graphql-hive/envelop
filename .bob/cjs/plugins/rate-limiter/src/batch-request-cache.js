"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWeakMapCache = exports.getNoOpCache = void 0;
const getNoOpCache = () => ({
    set: ({ newTimestamps }) => newTimestamps,
});
exports.getNoOpCache = getNoOpCache;
const getWeakMapCache = () => {
    const cache = new WeakMap();
    return {
        set: ({ context, fieldIdentity, newTimestamps, }) => {
            const currentCalls = cache.get(context) || {};
            currentCalls[fieldIdentity] = [...(currentCalls[fieldIdentity] || []), ...newTimestamps];
            cache.set(context, currentCalls);
            return currentCalls[fieldIdentity];
        },
    };
};
exports.getWeakMapCache = getWeakMapCache;
