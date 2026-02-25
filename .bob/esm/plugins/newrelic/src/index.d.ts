import { GraphQLError } from 'graphql';
import { DefaultContext, Plugin } from '@envelop/core';
export declare enum AttributeName {
    COMPONENT_NAME = "Envelop_NewRelic_Plugin",
    ANONYMOUS_OPERATION = "<anonymous>",
    EXECUTION_RESULT = "graphql.execute.result",
    EXECUTION_OPERATION_NAME = "graphql.execute.operationName",
    EXECUTION_OPERATION_TYPE = "graphql.execute.operationType",
    EXECUTION_OPERATION_DOCUMENT = "graphql.execute.document",
    EXECUTION_VARIABLES = "graphql.execute.variables",
    RESOLVER_FIELD_PATH = "graphql.resolver.fieldPath",
    RESOLVER_TYPE_NAME = "graphql.resolver.typeName",
    RESOLVER_RESULT_TYPE = "graphql.resolver.resultType",
    RESOLVER_RESULT = "graphql.resolver.result",
    RESOLVER_ARGS = "graphql.resolver.args"
}
export type UseNewRelicOptions = {
    includeOperationDocument?: boolean;
    includeExecuteVariables?: boolean | RegExp;
    includeRawResult?: boolean;
    trackResolvers?: boolean;
    includeResolverArgs?: boolean | RegExp;
    rootFieldsNaming?: boolean;
    /**
     * Function that returns a custom operation name to be used as transaction name and attribute
     */
    extractOperationName?: (context: DefaultContext) => string | undefined;
    /**
     * Indicates whether or not to skip reporting a given error to NewRelic.
     * By default, this plugin skips all `Error` errors and does not report them to NewRelic.
     */
    skipError?: (error: GraphQLError) => boolean;
    shim?: any;
};
export declare const useNewRelic: (rawOptions?: UseNewRelicOptions) => Plugin;
