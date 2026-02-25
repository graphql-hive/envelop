"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usePreloadAssets = void 0;
const core_1 = require("@envelop/core");
const usePreloadAssets = (opts) => ({
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
                    return (0, core_1.handleStreamOrSingleExecutionResult)(payload, ({ result, setResult }) => {
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
exports.usePreloadAssets = usePreloadAssets;
