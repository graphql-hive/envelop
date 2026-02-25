import { Plugin } from '@envelop/core';
export type DepthLimitConfig = {
    maxDepth: number;
    ignore?: string[];
};
export declare const useDepthLimit: (config: DepthLimitConfig) => Plugin;
