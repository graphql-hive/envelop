import type { Plugin } from '@envelop/types';
declare const fastIntroSpectionSymbol: unique symbol;
/**
 * In case a GraphQL operation only contains introspection fields the context building can be skipped completely.
 * With this plugin any further context extensions will be skipped.
 */
export declare const useImmediateIntrospection: () => Plugin<{
    [fastIntroSpectionSymbol]?: boolean;
}>;
export {};
