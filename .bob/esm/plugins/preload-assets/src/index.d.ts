import { Plugin } from '@envelop/core';
export type UsePreloadAssetsOpts = {
    shouldPreloadAssets?: (context: unknown) => boolean;
};
export declare const usePreloadAssets: (opts?: UsePreloadAssetsOpts) => Plugin;
