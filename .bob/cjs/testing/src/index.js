"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectAsyncIteratorValues = exports.useGraphQLJSEngine = void 0;
exports.createSpiedPlugin = createSpiedPlugin;
exports.createTestkit = createTestkit;
exports.assertSingleExecutionValue = assertSingleExecutionValue;
exports.assertStreamExecutionValue = assertStreamExecutionValue;
const tslib_1 = require("tslib");
const util_1 = require("util");
const GraphQLJS = tslib_1.__importStar(require("graphql"));
const graphql_1 = require("graphql");
const core_1 = require("@envelop/core");
const utils_1 = require("@graphql-tools/utils");
const promise_helpers_1 = require("@whatwg-node/promise-helpers");
const useGraphQLJSEngine = () => {
    return (0, core_1.useEngine)(GraphQLJS);
};
exports.useGraphQLJSEngine = useGraphQLJSEngine;
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
function createSpiedPlugin() {
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
function createTestkit(pluginsOrEnvelop, schema) {
    const toGraphQLErrorOrThrow = (thrownThing) => {
        if (thrownThing instanceof graphql_1.GraphQLError) {
            return thrownThing;
        }
        throw thrownThing;
    };
    const phasesReplacements = [];
    let getEnveloped = Array.isArray(pluginsOrEnvelop)
        ? (0, core_1.envelop)({
            plugins: [
                ...(schema
                    ? [(0, exports.useGraphQLJSEngine)(), (0, core_1.useSchema)((0, utils_1.mapSchema)(schema))]
                    : [(0, exports.useGraphQLJSEngine)()]),
                ...pluginsOrEnvelop,
            ],
        })
        : pluginsOrEnvelop;
    return {
        modifyPlugins(modifyPluginsFn) {
            getEnveloped = (0, core_1.envelop)({
                plugins: [
                    ...(schema
                        ? [(0, exports.useGraphQLJSEngine)(), (0, core_1.useSchema)((0, utils_1.mapSchema)(schema))]
                        : [(0, exports.useGraphQLJSEngine)()]),
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
                document = (0, utils_1.isDocumentNode)(operation) ? operation : proxy.parse(operation);
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
            const mainOperation = (0, graphql_1.getOperationAST)(document, operationName);
            if (mainOperation == null) {
                return {
                    errors: [new graphql_1.GraphQLError('Could not identify main operation.')],
                };
            }
            return (0, promise_helpers_1.handleMaybePromise)(() => proxy.contextFactory({
                request: {
                    headers: {},
                    method: 'POST',
                    query: '',
                    body: {
                        query: (0, core_1.getDocumentString)(document, graphql_1.print),
                        variables: variableValues,
                    },
                },
                document,
                operation: (0, core_1.getDocumentString)(document, graphql_1.print),
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
function assertSingleExecutionValue(input) {
    if ((0, core_1.isAsyncIterable)(input)) {
        throw new Error('Received stream but expected single result');
    }
}
function assertStreamExecutionValue(input) {
    if (!(0, core_1.isAsyncIterable)(input)) {
        throw new Error('Received single result but expected stream.' + (0, util_1.inspect)(input));
    }
}
const collectAsyncIteratorValues = async (asyncIterable) => {
    const values = [];
    for await (const value of asyncIterable) {
        values.push(value);
    }
    return values;
};
exports.collectAsyncIteratorValues = collectAsyncIteratorValues;
