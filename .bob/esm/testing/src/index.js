import { inspect } from 'util';
import * as GraphQLJS from 'graphql';
import { getOperationAST, GraphQLError, print, } from 'graphql';
import { envelop, getDocumentString, isAsyncIterable, useEngine, useSchema } from '@envelop/core';
import { mapSchema as cloneSchema, isDocumentNode } from '@graphql-tools/utils';
import { handleMaybePromise } from '@whatwg-node/promise-helpers';
export const useGraphQLJSEngine = () => {
    return useEngine(GraphQLJS);
};
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function createSpiedPlugin() {
    const afterResolver = jest.fn();
    const baseSpies = {
        onSchemaChange: jest.fn(),
        afterParse: jest.fn(),
        afterValidate: jest.fn(),
        afterContextBuilding: jest.fn(),
        afterExecute: jest.fn(),
        afterResolver,
        beforeResolver: jest.fn(() => afterResolver),
    };
    const spies = {
        ...baseSpies,
        beforeParse: jest.fn(() => baseSpies.afterParse),
        beforeValidate: jest.fn(() => baseSpies.afterValidate),
        beforeContextBuilding: jest.fn(() => baseSpies.afterContextBuilding),
        beforeExecute: jest.fn(() => ({
            onExecuteDone: baseSpies.afterExecute,
        })),
    };
    return {
        reset: () => {
            for (const [, value] of Object.entries(spies)) {
                value.mockReset();
            }
        },
        spies,
        plugin: {
            onSchemaChange: spies.onSchemaChange,
            onParse: spies.beforeParse,
            onValidate: spies.beforeValidate,
            onExecute: spies.beforeExecute,
            onContextBuilding: spies.beforeContextBuilding,
        },
    };
}
export function createTestkit(pluginsOrEnvelop, schema) {
    const toGraphQLErrorOrThrow = (thrownThing) => {
        if (thrownThing instanceof GraphQLError) {
            return thrownThing;
        }
        throw thrownThing;
    };
    const phasesReplacements = [];
    let getEnveloped = Array.isArray(pluginsOrEnvelop)
        ? envelop({
            plugins: [
                ...(schema
                    ? [useGraphQLJSEngine(), useSchema(cloneSchema(schema))]
                    : [useGraphQLJSEngine()]),
                ...pluginsOrEnvelop,
            ],
        })
        : pluginsOrEnvelop;
    return {
        modifyPlugins(modifyPluginsFn) {
            getEnveloped = envelop({
                plugins: [
                    ...(schema
                        ? [useGraphQLJSEngine(), useSchema(cloneSchema(schema))]
                        : [useGraphQLJSEngine()]),
                    ...modifyPluginsFn(getEnveloped._plugins),
                ],
            });
        },
        mockPhase(phaseReplacement) {
            phasesReplacements.push(phaseReplacement);
        },
        wait: ms => new Promise(resolve => setTimeout(resolve, ms)),
        execute: (operation, variableValues = {}, initialContext = {}, operationName) => {
            const proxy = getEnveloped(initialContext);
            for (const replacement of phasesReplacements) {
                switch (replacement.phase) {
                    case 'parse':
                        proxy.parse = replacement.fn;
                        break;
                    case 'validate':
                        proxy.validate = replacement.fn;
                        break;
                    case 'subscribe':
                        proxy.subscribe = replacement.fn;
                        break;
                    case 'execute':
                        proxy.execute = replacement.fn;
                        break;
                    case 'contextFactory':
                        proxy.contextFactory = replacement.fn;
                        break;
                }
            }
            let document;
            try {
                document = isDocumentNode(operation) ? operation : proxy.parse(operation);
            }
            catch (err) {
                return {
                    errors: [toGraphQLErrorOrThrow(err)],
                };
            }
            let validationErrors;
            try {
                validationErrors = proxy.validate(proxy.schema, document);
            }
            catch (err) {
                return {
                    errors: [toGraphQLErrorOrThrow(err)],
                };
            }
            if (validationErrors.length > 0) {
                return {
                    errors: validationErrors,
                };
            }
            const mainOperation = getOperationAST(document, operationName);
            if (mainOperation == null) {
                return {
                    errors: [new GraphQLError('Could not identify main operation.')],
                };
            }
            return handleMaybePromise(() => proxy.contextFactory({
                request: {
                    headers: {},
                    method: 'POST',
                    query: '',
                    body: {
                        query: getDocumentString(document, print),
                        variables: variableValues,
                    },
                },
                document,
                operation: getDocumentString(document, print),
                variables: variableValues,
                operationName,
                ...initialContext,
            }), contextValue => {
                if (mainOperation.operation === 'subscription') {
                    return proxy.subscribe({
                        variableValues,
                        contextValue,
                        schema: proxy.schema,
                        document,
                        rootValue: {},
                        operationName,
                    });
                }
                return proxy.execute({
                    variableValues,
                    contextValue,
                    schema: proxy.schema,
                    document,
                    rootValue: {},
                    operationName,
                });
            });
        },
    };
}
export function assertSingleExecutionValue(input) {
    if (isAsyncIterable(input)) {
        throw new Error('Received stream but expected single result');
    }
}
export function assertStreamExecutionValue(input) {
    if (!isAsyncIterable(input)) {
        throw new Error('Received single result but expected stream.' + inspect(input));
    }
}
export const collectAsyncIteratorValues = async (asyncIterable) => {
    const values = [];
    for await (const value of asyncIterable) {
        values.push(value);
    }
    return values;
};
