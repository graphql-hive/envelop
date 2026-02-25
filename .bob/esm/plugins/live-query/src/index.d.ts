import { Plugin } from '@envelop/core';
import { GraphQLLiveDirective } from '@n1ru4l/graphql-live-query';
import type { createApplyLiveQueryPatchGenerator } from '@n1ru4l/graphql-live-query-patch';
import type { InMemoryLiveQueryStore } from '@n1ru4l/in-memory-live-query-store';
export type UseLiveQueryOptions = {
    liveQueryStore: InMemoryLiveQueryStore;
    applyLiveQueryPatchGenerator?: ReturnType<typeof createApplyLiveQueryPatchGenerator>;
};
export { GraphQLLiveDirective };
export declare const GraphQLLiveDirectiveAST: import("graphql").DirectiveDefinitionNode;
export declare const GraphQLLiveDirectiveSDL: string;
export declare const useLiveQuery: (opts: UseLiveQueryOptions) => Plugin;
