import { GraphQLType, ResponsePath } from 'graphql';
import { Plugin } from '@envelop/core';
interface ResolverCall {
    path: ResponsePath;
    fieldName: string;
    parentType: GraphQLType;
    returnType: GraphQLType;
    startOffset: [number, number];
    endOffset?: [number, number];
}
declare const apolloTracingSymbol: unique symbol;
type TracingContextObject = {
    startTime: Date;
    resolversTiming: ResolverCall[];
    hrtime: [number, number];
};
export declare const useApolloTracing: () => Plugin<{
    [apolloTracingSymbol]: TracingContextObject;
}>;
export {};
