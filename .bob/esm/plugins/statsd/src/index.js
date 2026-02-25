import { isAsyncIterable, isIntrospectionOperationString, } from '@envelop/core';
export const metricNames = {
    operationCount: 'operations.count',
    errorCount: 'operations.error_count',
    latency: 'operations.latency',
};
const statsDPluginTagsSymbol = Symbol('statsDPluginTagsSymbol');
const statsDPluginExecutionStartTimeSymbol = Symbol('statsDPluginExecutionStartTimeSymbol');
function getOperation(document) {
    return document.definitions.find((def) => def.kind === 'OperationDefinition');
}
function isParseFailure(parseResult) {
    return parseResult === null || parseResult instanceof Error;
}
function getTags(context) {
    return context[statsDPluginTagsSymbol];
}
export const useStatsD = (options) => {
    const { client, prefix = 'graphql', skipIntrospection = false } = options;
    function createMetricName(name) {
        return `${prefix}.${name}`;
    }
    function increaseErrorCount(tags) {
        client.increment(createMetricName(metricNames.errorCount), tags);
    }
    function increaseOperationCount(tags) {
        client.increment(createMetricName(metricNames.operationCount), tags);
    }
    return {
        onEnveloped({ extendContext }) {
            extendContext({
                [statsDPluginExecutionStartTimeSymbol]: Date.now(),
            });
        },
        onParse({ extendContext, params }) {
            if (skipIntrospection && isIntrospectionOperationString(params.source)) {
                return;
            }
            return function onParseDone(payload) {
                if (isParseFailure(payload.result)) {
                    increaseErrorCount();
                    increaseOperationCount();
                }
                else {
                    const operation = getOperation(payload.result);
                    extendContext({
                        [statsDPluginTagsSymbol]: {
                            operation: operation?.name?.value || 'anonymous',
                        },
                    });
                }
            };
        },
        onValidate({ context }) {
            const tags = getTags(context);
            if (!tags) {
                return undefined;
            }
            return function onValidateDone({ valid }) {
                if (!valid) {
                    increaseErrorCount(tags);
                    increaseOperationCount(tags);
                }
            };
        },
        onExecute({ args }) {
            const tags = getTags(args.contextValue);
            if (!tags) {
                return undefined;
            }
            return {
                onExecuteDone({ result }) {
                    const latency = Date.now() - args.contextValue[statsDPluginExecutionStartTimeSymbol];
                    if (isAsyncIterable(result)) {
                        // eslint-disable-next-line no-console
                        console.warn(`Plugin "statsd" encountered a AsyncIterator which is not supported yet, so tracing data is not available for the operation.`);
                        return;
                    }
                    increaseOperationCount(tags);
                    if (result.errors && Array.isArray(result.errors)) {
                        increaseErrorCount(tags);
                    }
                    else {
                        client.histogram(createMetricName(metricNames.latency), latency, tags);
                    }
                },
            };
        },
    };
};
