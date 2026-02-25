"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useNewRelic = exports.AttributeName = void 0;
const tslib_1 = require("tslib");
const graphql_1 = require("graphql");
const newrelic_1 = tslib_1.__importDefault(require("newrelic"));
const core_1 = require("@envelop/core");
const on_resolve_1 = require("@envelop/on-resolve");
var AttributeName;
(function (AttributeName) {
    AttributeName["COMPONENT_NAME"] = "Envelop_NewRelic_Plugin";
    AttributeName["ANONYMOUS_OPERATION"] = "<anonymous>";
    AttributeName["EXECUTION_RESULT"] = "graphql.execute.result";
    AttributeName["EXECUTION_OPERATION_NAME"] = "graphql.execute.operationName";
    AttributeName["EXECUTION_OPERATION_TYPE"] = "graphql.execute.operationType";
    AttributeName["EXECUTION_OPERATION_DOCUMENT"] = "graphql.execute.document";
    AttributeName["EXECUTION_VARIABLES"] = "graphql.execute.variables";
    AttributeName["RESOLVER_FIELD_PATH"] = "graphql.resolver.fieldPath";
    AttributeName["RESOLVER_TYPE_NAME"] = "graphql.resolver.typeName";
    AttributeName["RESOLVER_RESULT_TYPE"] = "graphql.resolver.resultType";
    AttributeName["RESOLVER_RESULT"] = "graphql.resolver.result";
    AttributeName["RESOLVER_ARGS"] = "graphql.resolver.args";
})(AttributeName || (exports.AttributeName = AttributeName = {}));
const DEFAULT_OPTIONS = {
    includeOperationDocument: false,
    includeExecuteVariables: false,
    includeRawResult: false,
    trackResolvers: false,
    includeResolverArgs: false,
    rootFieldsNaming: false,
    skipError: () => false,
};
const useNewRelic = (rawOptions) => {
    const options = {
        ...DEFAULT_OPTIONS,
        ...rawOptions,
    };
    options.isExecuteVariablesRegex = options.includeExecuteVariables instanceof RegExp;
    options.isResolverArgsRegex = options.includeResolverArgs instanceof RegExp;
    const instrumentationApi = rawOptions?.shim || newrelic_1.default?.shim;
    if (!instrumentationApi?.agent) {
        // eslint-disable-next-line no-console
        console.warn('Agent unavailable. Please check your New Relic Agent configuration and ensure New Relic is enabled.');
        return {};
    }
    instrumentationApi.agent.metrics
        .getOrCreateMetric(`Supportability/ExternalModules/${AttributeName.COMPONENT_NAME}`)
        .incrementCallCount();
    const logger = instrumentationApi.logger.child({ component: AttributeName.COMPONENT_NAME });
    logger.info(`${AttributeName.COMPONENT_NAME} registered`);
    return {
        onPluginInit({ addPlugin }) {
            if (options.trackResolvers) {
                addPlugin((0, on_resolve_1.useOnResolve)(({ args: resolversArgs, info }) => {
                    const transaction = instrumentationApi.agent.tracer.getTransaction();
                    if (!transaction) {
                        logger.trace('No transaction found. Not recording resolver.');
                        return () => { };
                    }
                    const transactionNameState = transaction.nameState;
                    if (!transactionNameState) {
                        logger.trace('No transaction name state found. Not recording resolver.');
                        return () => { };
                    }
                    const delimiter = transactionNameState.delimiter;
                    const { returnType, path, parentType } = info;
                    const formattedPath = flattenPath(path, delimiter);
                    const currentSegment = instrumentationApi.getActiveSegment();
                    if (!currentSegment) {
                        logger.trace('No active segment found at resolver call. Not recording resolver (%s).', formattedPath);
                        return () => { };
                    }
                    const resolverSegment = instrumentationApi.createSegment(`resolver${delimiter}${formattedPath}`, null, currentSegment);
                    if (!resolverSegment) {
                        logger.trace('Resolver segment was not created (%s).', formattedPath);
                        return () => { };
                    }
                    resolverSegment.start();
                    resolverSegment.addAttribute(AttributeName.RESOLVER_FIELD_PATH, formattedPath);
                    resolverSegment.addAttribute(AttributeName.RESOLVER_TYPE_NAME, parentType.toString());
                    resolverSegment.addAttribute(AttributeName.RESOLVER_RESULT_TYPE, returnType.toString());
                    if (options.includeResolverArgs) {
                        const rawArgs = resolversArgs || {};
                        const resolverArgsToTrack = options.isResolverArgsRegex
                            ? filterPropertiesByRegex(rawArgs, options.includeResolverArgs)
                            : rawArgs;
                        resolverSegment.addAttribute(AttributeName.RESOLVER_ARGS, JSON.stringify(resolverArgsToTrack));
                    }
                    return ({ result }) => {
                        if (options.includeRawResult) {
                            resolverSegment.addAttribute(AttributeName.RESOLVER_RESULT, JSON.stringify(result));
                        }
                        resolverSegment.end();
                    };
                }));
            }
        },
        onExecute({ args }) {
            const rootOperation = (0, graphql_1.getOperationAST)(args.document, args.operationName);
            if (!rootOperation) {
                logger.trace('No root operation found. Not recording transaction.');
                return;
            }
            const operationType = rootOperation.operation;
            const operationName = options.extractOperationName?.(args.contextValue) ||
                args.operationName ||
                rootOperation.name?.value ||
                AttributeName.ANONYMOUS_OPERATION;
            const transaction = instrumentationApi.agent.tracer.getTransaction();
            const transactionNameState = transaction?.nameState;
            if (transactionNameState) {
                const delimiter = transactionNameState.delimiter || '/';
                let rootFields = null;
                if (options.rootFieldsNaming) {
                    const fieldNodes = rootOperation.selectionSet.selections.filter(selectionNode => selectionNode.kind === graphql_1.Kind.FIELD);
                    rootFields = fieldNodes.map(fieldNode => fieldNode.name.value);
                }
                const operationType = rootOperation.operation;
                transactionNameState.setName(transactionNameState.prefix, transactionNameState.verb, delimiter, operationType +
                    delimiter +
                    operationName +
                    (rootFields ? delimiter + rootFields.join('&') : ''));
            }
            const spanContext = instrumentationApi.agent.tracer.getSpanContext();
            spanContext?.addCustomAttribute(AttributeName.EXECUTION_OPERATION_NAME, operationName);
            spanContext?.addCustomAttribute(AttributeName.EXECUTION_OPERATION_TYPE, operationType);
            options.includeOperationDocument &&
                spanContext?.addCustomAttribute(AttributeName.EXECUTION_OPERATION_DOCUMENT, (0, core_1.getDocumentString)(args.document, graphql_1.print));
            if (options.includeExecuteVariables) {
                const rawVariables = args.variableValues || {};
                const executeVariablesToTrack = options.isExecuteVariablesRegex
                    ? filterPropertiesByRegex(rawVariables, options.includeExecuteVariables)
                    : rawVariables;
                spanContext?.addCustomAttribute(AttributeName.EXECUTION_VARIABLES, JSON.stringify(executeVariablesToTrack));
            }
            const operationSegment = instrumentationApi.getActiveSegment();
            return {
                onExecuteDone({ result }) {
                    const sendResult = (singularResult) => {
                        if (singularResult.data && options.includeRawResult) {
                            spanContext?.addCustomAttribute(AttributeName.EXECUTION_RESULT, JSON.stringify(singularResult));
                        }
                        if (singularResult.errors && singularResult.errors.length > 0) {
                            const agent = instrumentationApi.agent;
                            const transaction = instrumentationApi.tracer.getTransaction();
                            if (transaction) {
                                for (const error of singularResult.errors) {
                                    if (options.skipError?.(error))
                                        continue;
                                    agent.errors.add(transaction, JSON.stringify(error));
                                }
                            }
                        }
                    };
                    if ((0, core_1.isAsyncIterable)(result)) {
                        return {
                            onNext: ({ result: singularResult }) => {
                                sendResult(singularResult);
                            },
                            onEnd: () => {
                                operationSegment?.end();
                            },
                        };
                    }
                    sendResult(result);
                    operationSegment?.end();
                    return {};
                },
            };
        },
    };
};
exports.useNewRelic = useNewRelic;
function flattenPath(fieldPath, delimiter = '/') {
    const pathArray = [];
    let thisPath = fieldPath;
    while (thisPath) {
        if (typeof thisPath.key !== 'number') {
            pathArray.push(thisPath.key);
        }
        thisPath = thisPath.prev;
    }
    return pathArray.reverse().join(delimiter);
}
function filterPropertiesByRegex(initialObject, pattern) {
    const filteredObject = {};
    for (const property of Object.keys(initialObject)) {
        if (pattern.test(property))
            filteredObject[property] = initialObject[property];
    }
    return filteredObject;
}
