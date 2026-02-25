"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useOpenTelemetry = exports.otelContextMap = exports.AttributeName = void 0;
exports.getCurrentOtelContext = getCurrentOtelContext;
exports.setCurrentOtelContext = setCurrentOtelContext;
const tslib_1 = require("tslib");
const graphql_1 = require("graphql");
const core_1 = require("@envelop/core");
const on_resolve_1 = require("@envelop/on-resolve");
const api_1 = require("@opentelemetry/api");
const opentelemetry = tslib_1.__importStar(require("@opentelemetry/api"));
const sdk_trace_base_1 = require("@opentelemetry/sdk-trace-base");
const has_inline_argument_js_1 = require("./has-inline-argument.js");
var AttributeName;
(function (AttributeName) {
    AttributeName["EXECUTION_ERROR"] = "graphql.execute.error";
    AttributeName["EXECUTION_RESULT"] = "graphql.execute.result";
    AttributeName["RESOLVER_EXCEPTION"] = "graphql.resolver.exception";
    AttributeName["RESOLVER_FIELD_NAME"] = "graphql.resolver.fieldName";
    AttributeName["RESOLVER_TYPE_NAME"] = "graphql.resolver.typeName";
    AttributeName["RESOLVER_RESULT_TYPE"] = "graphql.resolver.resultType";
    AttributeName["RESOLVER_ARGS"] = "graphql.resolver.args";
    AttributeName["EXECUTION_OPERATION_NAME"] = "graphql.execute.operationName";
    AttributeName["EXECUTION_OPERATION_TYPE"] = "graphql.execute.operationType";
    AttributeName["EXECUTION_OPERATION_DOCUMENT"] = "graphql.execute.document";
    AttributeName["EXECUTION_VARIABLES"] = "graphql.execute.variables";
})(AttributeName || (exports.AttributeName = AttributeName = {}));
const tracingSpanSymbol = Symbol('OPEN_TELEMETRY_GRAPHQL');
exports.otelContextMap = new WeakMap();
function getCurrentOtelContext(graphqlContext) {
    let otelContext = exports.otelContextMap.get(graphqlContext);
    if (!otelContext) {
        otelContext = opentelemetry.context.active();
        exports.otelContextMap.set(graphqlContext, otelContext);
    }
    return otelContext;
}
function setCurrentOtelContext(graphqlContext, otelContext) {
    exports.otelContextMap.set(graphqlContext, otelContext);
    return otelContext;
}
const useOpenTelemetry = (options, tracingProvider, spanKind = api_1.SpanKind.SERVER, spanAdditionalAttributes = {}, serviceName = 'graphql', spanPrefix = '') => {
    if (!tracingProvider) {
        const basicTraceProvider = new sdk_trace_base_1.BasicTracerProvider();
        basicTraceProvider.addSpanProcessor(new sdk_trace_base_1.SimpleSpanProcessor(new sdk_trace_base_1.ConsoleSpanExporter()));
        basicTraceProvider.register();
        tracingProvider = basicTraceProvider;
    }
    const tracer = tracingProvider.getTracer(serviceName);
    const spanByContext = new WeakMap();
    return {
        onPluginInit({ addPlugin }) {
            if (options.resolvers) {
                addPlugin((0, on_resolve_1.useOnResolve)(({ info, context, args }) => {
                    const parentSpan = spanByContext.get(context);
                    if (parentSpan) {
                        const ctx = opentelemetry.trace.setSpan(getCurrentOtelContext(context), parentSpan);
                        const { fieldName, returnType, parentType } = info;
                        const resolverSpan = tracer.startSpan(`${spanPrefix}${parentType.name}.${fieldName}`, {
                            attributes: {
                                [AttributeName.RESOLVER_FIELD_NAME]: fieldName,
                                [AttributeName.RESOLVER_TYPE_NAME]: parentType.toString(),
                                [AttributeName.RESOLVER_RESULT_TYPE]: returnType.toString(),
                                [AttributeName.RESOLVER_ARGS]: JSON.stringify(args || {}),
                            },
                        }, ctx);
                        return ({ result }) => {
                            if (result instanceof Error) {
                                resolverSpan.recordException({
                                    name: AttributeName.RESOLVER_EXCEPTION,
                                    message: JSON.stringify(result),
                                });
                            }
                            else {
                                resolverSpan.end();
                            }
                        };
                    }
                    return () => { };
                }, { skipDefaultResolvers: options.defaultResolvers === false }));
            }
        },
        onExecute({ args, executeFn, setExecuteFn }) {
            setExecuteFn(function wrappedExecuteFnWithOtelCtx(args) {
                return opentelemetry.context.with(getCurrentOtelContext(args.contextValue), () => executeFn(args));
            });
            const operationAst = (0, graphql_1.getOperationAST)(args.document, args.operationName);
            if (!operationAst) {
                return;
            }
            if (options.excludedOperationNames &&
                (typeof options.excludedOperationNames === 'function'
                    ? options.excludedOperationNames(operationAst.name?.value)
                    : options.excludedOperationNames.includes(operationAst.name?.value || ''))) {
                return;
            }
            const operationType = operationAst.operation;
            let isDocumentLoggable;
            if (options.document == null || options.document === true) {
                if (options.variables) {
                    isDocumentLoggable = true;
                }
                else if (!(0, has_inline_argument_js_1.hasInlineArgument)(args.document)) {
                    isDocumentLoggable = true;
                }
                else {
                    isDocumentLoggable = false;
                }
            }
            else {
                isDocumentLoggable = false;
            }
            const operationName = operationAst.name?.value || 'anonymous';
            const currOtelContext = getCurrentOtelContext(args.contextValue);
            const variablesAttribute = options.variables
                ? {
                    [AttributeName.EXECUTION_VARIABLES]: typeof options.variables === 'function'
                        ? options.variables(args.variableValues)
                        : JSON.stringify(args.variableValues ?? {}),
                }
                : {};
            const executionSpan = tracer.startSpan(`${spanPrefix}${operationType}.${operationName}`, {
                kind: spanKind,
                attributes: {
                    ...spanAdditionalAttributes,
                    [AttributeName.EXECUTION_OPERATION_NAME]: operationName,
                    [AttributeName.EXECUTION_OPERATION_TYPE]: operationType,
                    [AttributeName.EXECUTION_OPERATION_DOCUMENT]: isDocumentLoggable
                        ? (0, core_1.getDocumentString)(args.document, graphql_1.print)
                        : undefined,
                    ...variablesAttribute,
                },
            }, currOtelContext);
            setCurrentOtelContext(args.contextValue, opentelemetry.trace.setSpan(currOtelContext, executionSpan));
            const resultCbs = {
                onExecuteDone({ result, setResult }) {
                    if (!(0, core_1.isAsyncIterable)(result)) {
                        if (result.data && options.result) {
                            executionSpan.setAttribute(AttributeName.EXECUTION_RESULT, JSON.stringify(result));
                        }
                        if (options.traceIdInResult) {
                            const currOtelContext = getCurrentOtelContext(args.contextValue);
                            setResult(addTraceIdToResult(currOtelContext, result, options.traceIdInResult));
                        }
                        markError(executionSpan, result);
                        executionSpan.end();
                    }
                    return {
                        // handles async iterator
                        onNext: ({ result, setResult }) => {
                            if (options.traceIdInResult) {
                                const currOtelContext = getCurrentOtelContext(args.contextValue);
                                setResult(addTraceIdToResult(currOtelContext, result, options.traceIdInResult));
                            }
                            markError(executionSpan, result);
                        },
                        onEnd: () => {
                            executionSpan.end();
                        },
                    };
                },
            };
            if (options.resolvers) {
                spanByContext.set(args.contextValue, executionSpan);
            }
            return resultCbs;
        },
        onSubscribe({ args, subscribeFn, setSubscribeFn }) {
            setSubscribeFn(function wrappedSubscribeFnWithOtelCtx(args) {
                return opentelemetry.context.with(getCurrentOtelContext(args.contextValue), () => subscribeFn(args));
            });
            const operationAst = (0, graphql_1.getOperationAST)(args.document, args.operationName);
            if (!operationAst) {
                return;
            }
            if (options.excludedOperationNames &&
                (typeof options.excludedOperationNames === 'function'
                    ? options.excludedOperationNames(operationAst.name?.value)
                    : options.excludedOperationNames.includes(operationAst.name?.value || ''))) {
                return;
            }
            const operationType = 'subscription';
            let isDocumentLoggable;
            if (options.variables) {
                isDocumentLoggable = true;
            }
            else if (!(0, has_inline_argument_js_1.hasInlineArgument)(args.document)) {
                isDocumentLoggable = true;
            }
            else {
                isDocumentLoggable = false;
            }
            const currOtelContext = getCurrentOtelContext(args.contextValue);
            const operationName = operationAst.name?.value || 'anonymous';
            const variablesAttribute = options.variables
                ? {
                    [AttributeName.EXECUTION_VARIABLES]: typeof options.variables === 'function'
                        ? options.variables(args.variableValues)
                        : JSON.stringify(args.variableValues ?? {}),
                }
                : {};
            const subscriptionSpan = tracer.startSpan(`${operationType}.${operationName}`, {
                kind: spanKind,
                attributes: {
                    ...spanAdditionalAttributes,
                    [AttributeName.EXECUTION_OPERATION_NAME]: operationName,
                    [AttributeName.EXECUTION_OPERATION_TYPE]: operationType,
                    [AttributeName.EXECUTION_OPERATION_DOCUMENT]: isDocumentLoggable
                        ? (0, core_1.getDocumentString)(args.document, graphql_1.print)
                        : undefined,
                    ...variablesAttribute,
                },
            }, currOtelContext);
            setCurrentOtelContext(args.contextValue, opentelemetry.trace.setSpan(currOtelContext, subscriptionSpan));
            const resultCbs = {
                onSubscribeError: ({ error }) => {
                    if (error)
                        subscriptionSpan.setStatus({ code: api_1.SpanStatusCode.ERROR });
                },
                onSubscribeResult() {
                    return {
                        // handles async iterator
                        onNext: ({ result, setResult }) => {
                            if (options.traceIdInResult) {
                                const currOtelContext = getCurrentOtelContext(args.contextValue);
                                setResult(addTraceIdToResult(currOtelContext, result, options.traceIdInResult));
                            }
                            markError(subscriptionSpan, result);
                        },
                        onEnd: () => {
                            subscriptionSpan.end();
                        },
                    };
                },
            };
            if (options.resolvers) {
                spanByContext.set(args.contextValue, subscriptionSpan);
            }
            return resultCbs;
        },
    };
};
exports.useOpenTelemetry = useOpenTelemetry;
function addTraceIdToResult(ctx, result, traceIdProp) {
    return {
        ...result,
        extensions: {
            ...result.extensions,
            [traceIdProp]: opentelemetry.trace.getSpan(ctx)?.spanContext().traceId,
        },
    };
}
function markError(executionSpan, result) {
    if (result.errors && result.errors.length > 0) {
        executionSpan.setStatus({ code: opentelemetry.SpanStatusCode.ERROR });
        executionSpan.recordException({
            name: AttributeName.EXECUTION_ERROR,
            message: JSON.stringify(result.errors),
        });
    }
}
