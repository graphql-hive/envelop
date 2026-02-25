import { Plugin, PromiseOrValue } from '@envelop/core';
declare const OPERATION_PERMISSIONS_SYMBOL: unique symbol;
type ScopeContext = {
    allowAll: boolean;
    wildcardTypes: Set<string>;
    schemaCoordinates: Set<string>;
};
type OperationScopeRuleOptions = {
    formatError: (schemaCoordinate: string) => string;
};
type OperationScopeOptions<TContext> = {
    getPermissions: (context: TContext) => PromiseOrValue<Set<string> | string>;
    formatError?: OperationScopeRuleOptions['formatError'];
};
export declare const useOperationFieldPermissions: <TContext>(opts: OperationScopeOptions<TContext>) => Plugin<{
    [OPERATION_PERMISSIONS_SYMBOL]: ScopeContext;
}>;
export {};
