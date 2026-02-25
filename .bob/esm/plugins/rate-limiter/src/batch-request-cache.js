export const getNoOpCache = () => ({
    set: ({ newTimestamps }) => newTimestamps,
});
export const getWeakMapCache = () => {
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
