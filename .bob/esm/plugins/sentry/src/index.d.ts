import { isOriginalGraphQLError, TypedExecutionArgs, type Plugin } from '@envelop/core';
import * as Sentry from '@sentry/node';
interface TraceparentData {
    /**
     * Trace ID
     */
    traceId?: string | undefined;
    /**
     * Parent Span ID
     */
    parentSpanId?: string | undefined;
    /**
     * If this transaction has a parent, the parent's sampling decision
     */
    parentSampled?: boolean | undefined;
}
export type SentryPluginOptions<PluginContext extends Record<string, any>> = {
    /**
     * Force the creation of a new transaction for every GraphQL Operation.
     * By default, Sentry mange the creation of transactions automatically.
     * By enabling this option, you can ensure that the GraphQL execution pipeline
     * is always wrapped in its own transaction.
     *
     * @default false
     */
    forceTransaction?: boolean;
    /**
     * Renames Transaction.
     * @default false
     */
    renameTransaction?: boolean;
    /**
     * Adds result of each resolver and operation to Span's data (available under "result")
     * @default false
     */
    includeRawResult?: boolean;
    /**
     * Adds operation's variables to a Scope (only in case of errors)
     * @default false
     */
    includeExecuteVariables?: boolean;
    /**
     * The key of the event id in the error's extension. `null` to disable.
     * @default sentryEventId
     */
    eventIdKey?: string | null;
    /**
     * Adds custom tags to every Span.
     */
    appendTags?: (args: TypedExecutionArgs<PluginContext>) => Record<string, unknown>;
    /**
     * Callback to set context information onto the scope.
     */
    configureScope?: (args: TypedExecutionArgs<PluginContext>, scope: Sentry.Scope) => void;
    /**
     * Produces a name of Transaction (only when "renameTransaction" or "forceTransaction" are enabled) and description of created Span.
     *
     * @default operation's name or "Anonymous Operation" when missing)
     */
    transactionName?: (args: TypedExecutionArgs<PluginContext>) => string;
    /**
     * Produces tracing data for Span
     *
     * @default is empty
     */
    traceparentData?: (args: TypedExecutionArgs<PluginContext>) => TraceparentData | undefined;
    /**
     * Produces a "op" (operation) of created Span.
     *
     * @default execute
     */
    operationName?: (args: TypedExecutionArgs<PluginContext>) => string;
    /**
     * Indicates whether or not to skip the entire Sentry flow for given GraphQL operation.
     * By default, no operations are skipped.
     */
    skip?: (args: TypedExecutionArgs<PluginContext>) => boolean;
    /**
     * Indicates whether or not to skip Sentry exception reporting for a given error.
     * By default, this plugin skips all `GraphQLError` errors and does not report it to Sentry.
     */
    skipError?: (args: Error) => boolean;
};
export declare const defaultSkipError: typeof isOriginalGraphQLError;
export declare const useSentry: <PluginContext extends Record<string, any> = {}>(options?: SentryPluginOptions<PluginContext>) => Plugin<PluginContext>;
export {};
