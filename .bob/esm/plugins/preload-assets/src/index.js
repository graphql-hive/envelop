import { handleStreamOrSingleExecutionResult } from '@envelop/core';
export const usePreloadAssets = (opts) => ({
    onExecute: ({ extendContext, args }) => {
        const assets = new Set();
        extendContext({
            registerPreloadAsset: (assetUrl) => assets.add(assetUrl),
        });
        if (opts?.shouldPreloadAssets?.(args.contextValue) ?? true) {
            return {
                onExecuteDone: payload => {
                    if (!assets.size) {
                        return;
                    }
                    return handleStreamOrSingleExecutionResult(payload, ({ result, setResult }) => {
                        setResult({
                            ...result,
                            extensions: {
                                ...result.extensions,
                                preloadAssets: Array.from(assets),
                            },
                        });
                    });
                },
            };
        }
        return undefined;
    },
});
