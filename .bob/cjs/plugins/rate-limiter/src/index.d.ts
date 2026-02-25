import { GraphQLField, GraphQLNamedOutputType } from 'graphql';
import type { Plugin } from '@envelop/core';
import { getGraphQLRateLimiter } from './get-graphql-rate-limiter.js';
import { InMemoryStore } from './in-memory-store.js';
import { RedisStore } from './redis-store.js';
import { Store } from './store.js';
import { FormatErrorInput, GraphQLRateLimitConfig, GraphQLRateLimitDirectiveArgs, Identity, Options } from './types.js';
export { FormatErrorInput, GraphQLRateLimitConfig, GraphQLRateLimitDirectiveArgs, Identity, InMemoryStore, Options, RedisStore, Store, };
export type IdentifyFn<ContextType = unknown> = (context: ContextType) => string;
interface RateLimitExecutionParams<ContextType = unknown> {
    root: unknown;
    args: Record<string, unknown>;
    context: ContextType;
    type: GraphQLNamedOutputType;
    field: GraphQLField<any, any>;
}
export type MessageInterpolator<ContextType = unknown> = (message: string, identifier: string, params: RateLimitExecutionParams<ContextType>) => string;
export declare const DIRECTIVE_SDL = "\n  directive @rateLimit(\n    max: Int\n    window: String\n    message: String\n    identityArgs: [String]\n    arrayLengthField: String\n    readOnly: Boolean\n    uncountRejected: Boolean\n  ) on FIELD_DEFINITION\n";
export type RateLimitDirectiveArgs = {
    max?: number;
    window?: string;
    message?: string;
    identityArgs?: string[];
    arrayLengthField?: string;
    readOnly?: boolean;
    uncountRejected?: boolean;
};
export type RateLimiterPluginOptions = {
    identifyFn: IdentifyFn;
    rateLimitDirectiveName?: 'rateLimit' | string;
    transformError?: (message: string) => Error;
    onRateLimitError?: (event: {
        error: string;
        identifier: string;
    } & RateLimitExecutionParams) => void;
    interpolateMessage?: MessageInterpolator;
    configByField?: ConfigByField[];
} & Omit<GraphQLRateLimitConfig, 'identifyContext'>;
export interface ConfigByField extends RateLimitDirectiveArgs {
    type: string;
    field: string;
    identifyFn?: IdentifyFn;
}
export declare const defaultInterpolateMessageFn: MessageInterpolator;
interface RateLimiterContext {
    rateLimiterFn: ReturnType<typeof getGraphQLRateLimiter>;
}
export declare const useRateLimiter: (options: RateLimiterPluginOptions) => Plugin<RateLimiterContext>;
