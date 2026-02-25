import { Plugin } from '@envelop/core';
import { SpanAttributes, SpanKind, TracerProvider } from '@opentelemetry/api';
import * as opentelemetry from '@opentelemetry/api';
export declare enum AttributeName {
    EXECUTION_ERROR = "graphql.execute.error",
    EXECUTION_RESULT = "graphql.execute.result",
    RESOLVER_EXCEPTION = "graphql.resolver.exception",
    RESOLVER_FIELD_NAME = "graphql.resolver.fieldName",
    RESOLVER_TYPE_NAME = "graphql.resolver.typeName",
    RESOLVER_RESULT_TYPE = "graphql.resolver.resultType",
    RESOLVER_ARGS = "graphql.resolver.args",
    EXECUTION_OPERATION_NAME = "graphql.execute.operationName",
    EXECUTION_OPERATION_TYPE = "graphql.execute.operationType",
    EXECUTION_OPERATION_DOCUMENT = "graphql.execute.document",
    EXECUTION_VARIABLES = "graphql.execute.variables"
}
declare const tracingSpanSymbol: unique symbol;
export type ResolveVariablesAttributesFn = (variableValues: any) => opentelemetry.AttributeValue;
export type ExcludeOperationNamesFn = (operationName: string | undefined) => boolean;
export type TracingOptions = {
    document?: boolean;
    resolvers?: boolean;
    defaultResolvers?: boolean;
    variables?: boolean | ResolveVariablesAttributesFn;
    result?: boolean;
    traceIdInResult?: string;
    excludedOperationNames?: string[] | ExcludeOperationNamesFn;
};
type PluginContext = {
    [tracingSpanSymbol]: opentelemetry.Span;
};
export declare const otelContextMap: WeakMap<any, opentelemetry.Context>;
export declare function getCurrentOtelContext(graphqlContext: any): opentelemetry.Context;
export declare function setCurrentOtelContext(graphqlContext: any, otelContext: opentelemetry.Context): opentelemetry.Context;
export declare const useOpenTelemetry: (options: TracingOptions, tracingProvider?: TracerProvider, spanKind?: SpanKind, spanAdditionalAttributes?: SpanAttributes, serviceName?: string, spanPrefix?: string) => Plugin<PluginContext>;
export {};
