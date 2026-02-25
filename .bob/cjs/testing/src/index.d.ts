import { DocumentNode, ExecutionResult, GraphQLSchema } from 'graphql';
import { envelop } from '@envelop/core';
import { GetEnvelopedFn, Plugin } from '@envelop/types';
export declare const useGraphQLJSEngine: () => Plugin<{}>;
export type ModifyPluginsFn = (plugins: Plugin<any>[]) => Plugin<any>[];
export type PhaseReplacementParams = {
    phase: 'parse';
    fn: ReturnType<GetEnvelopedFn<any>>['parse'];
} | {
    phase: 'validate';
    fn: ReturnType<GetEnvelopedFn<any>>['validate'];
} | {
    phase: 'execute';
    fn: ReturnType<GetEnvelopedFn<any>>['execute'];
} | {
    phase: 'subscribe';
    fn: ReturnType<GetEnvelopedFn<any>>['subscribe'];
} | {
    phase: 'contextFactory';
    fn: () => any | Promise<any>;
};
export declare function createSpiedPlugin(): {
    reset: () => void;
    spies: {
        beforeParse: jest.Mock<jest.Mock<any, any, any>, [], any>;
        beforeValidate: jest.Mock<jest.Mock<any, any, any>, [], any>;
        beforeContextBuilding: jest.Mock<jest.Mock<any, any, any>, [], any>;
        beforeExecute: jest.Mock<{
            onExecuteDone: jest.Mock<any, any, any>;
        }, [], any>;
        onSchemaChange: jest.Mock<any, any, any>;
        afterParse: jest.Mock<any, any, any>;
        afterValidate: jest.Mock<any, any, any>;
        afterContextBuilding: jest.Mock<any, any, any>;
        afterExecute: jest.Mock<any, any, any>;
        afterResolver: jest.Mock<any, any, any>;
        beforeResolver: jest.Mock<jest.Mock<any, any, any>, [], any>;
    };
    plugin: Plugin;
};
type MaybePromise<T> = T | Promise<T>;
type MaybeAsyncIterableIterator<T> = T | AsyncIterableIterator<T>;
type ExecutionReturn<TData = any, TExtensions = any> = MaybeAsyncIterableIterator<ExecutionResult<TData, TExtensions>>;
export type TestkitInstance = {
    execute: (operation: DocumentNode | string, variables?: Record<string, any>, initialContext?: any, operationName?: string) => MaybePromise<ExecutionReturn>;
    modifyPlugins: (modifyPluginsFn: ModifyPluginsFn) => void;
    mockPhase: (phaseReplacement: PhaseReplacementParams) => void;
    wait: (ms: number) => Promise<void>;
};
export declare function createTestkit(pluginsOrEnvelop: GetEnvelopedFn<any> | Parameters<typeof envelop>['0']['plugins'], schema?: GraphQLSchema): TestkitInstance;
export declare function assertSingleExecutionValue<TData = any, TExtensions = any>(input: ExecutionReturn<TData, TExtensions>): asserts input is ExecutionResult<TData, TExtensions>;
export declare function assertStreamExecutionValue<TData = any, TExtensions = any>(input: ExecutionReturn<TData, TExtensions>): asserts input is AsyncIterableIterator<ExecutionResult<TData, TExtensions>>;
export declare const collectAsyncIteratorValues: <TType>(asyncIterable: AsyncIterableIterator<TType>) => Promise<Array<TType>>;
export {};
