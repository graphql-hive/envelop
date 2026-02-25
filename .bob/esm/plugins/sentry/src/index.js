import { Kind, print } from 'graphql';
import { getDocumentString, handleStreamOrSingleExecutionResult, isOriginalGraphQLError, } from '@envelop/core';
import * as Sentry from '@sentry/node';
export const defaultSkipError = isOriginalGraphQLError;
export const useSentry = (options = {}) => {
    function pick(key, defaultValue) {
        return options[key] ?? defaultValue;
    }
    const forceTransaction = pick('forceTransaction', false);
    const includeRawResult = pick('includeRawResult', false);
    const includeExecuteVariables = pick('includeExecuteVariables', false);
    const renameTransaction = pick('renameTransaction', false);
    const skipOperation = pick('skip', () => false);
    const skipError = pick('skipError', defaultSkipError);
    const eventIdKey = options.eventIdKey === null ? null : 'sentryEventId';
    function addEventId(err, eventId) {
        if (eventIdKey !== null && eventId !== null) {
            err.extensions[eventIdKey] = eventId;
        }
        return err;
    }
    return {
        onExecute({ args, executeFn, setExecuteFn }) {
            if (skipOperation(args)) {
                return;
            }
            const rootOperation = args.document.definitions.find(
            // @ts-expect-error TODO: not sure how we will make it dev friendly
            o => o.kind === Kind.OPERATION_DEFINITION);
            const operationType = rootOperation.operation;
            const document = getDocumentString(args.document, print);
            const opName = args.operationName || rootOperation.name?.value || 'Anonymous Operation';
            const addedTags = (options.appendTags && options.appendTags(args)) || {};
            const traceparentData = (options.traceparentData && options.traceparentData(args)) || {};
            const transactionName = options.transactionName ? options.transactionName(args) : opName;
            const op = options.operationName ? options.operationName(args) : 'execute';
            const tags = {
                operationName: opName,
                operation: operationType,
                ...addedTags,
            };
            return Sentry.startSpanManual({
                name: transactionName,
                op,
                attributes: tags,
                forceTransaction,
                ...traceparentData,
            }, rootSpan => {
                rootSpan.setAttribute('document', document);
                if (renameTransaction) {
                    Sentry.getCurrentScope().setTransactionName(transactionName);
                }
                if (options.configureScope) {
                    options.configureScope(args, Sentry.getCurrentScope());
                }
                // Give access to the span during resolvers execution
                setExecuteFn(args => Sentry.withActiveSpan(rootSpan, () => executeFn(args)));
                return {
                    onExecuteDone(payload) {
                        const handleResult = ({ result, setResult, }) => {
                            if (includeRawResult) {
                                // @ts-expect-error TODO: not sure if this is correct
                                rootSpan?.setAttribute('result', result);
                            }
                            if (result.errors && result.errors.length > 0) {
                                Sentry.withScope(scope => {
                                    scope.setTransactionName(opName);
                                    scope.setTag('operation', operationType);
                                    scope.setTag('operationName', opName);
                                    scope.setExtra('document', document);
                                    scope.setTags(addedTags || {});
                                    if (includeRawResult) {
                                        scope.setExtra('result', result);
                                    }
                                    if (includeExecuteVariables) {
                                        scope.setExtra('variables', args.variableValues);
                                    }
                                    const errors = result.errors?.map(err => {
                                        if (skipError(err) === true) {
                                            return err;
                                        }
                                        const errorPath = (err.path ?? [])
                                            .map((v) => (typeof v === 'number' ? '$index' : v))
                                            .join(' > ');
                                        if (errorPath) {
                                            scope.addBreadcrumb({
                                                category: 'execution-path',
                                                message: errorPath,
                                                level: 'debug',
                                            });
                                        }
                                        const eventId = Sentry.captureException(err.originalError, {
                                            fingerprint: ['graphql', errorPath, opName, operationType],
                                            contexts: {
                                                GraphQL: {
                                                    operationName: opName,
                                                    operationType,
                                                    variables: args.variableValues,
                                                },
                                            },
                                        });
                                        return addEventId(err, eventId);
                                    });
                                    setResult({
                                        ...result,
                                        errors,
                                    });
                                });
                            }
                            rootSpan?.end();
                        };
                        return handleStreamOrSingleExecutionResult(payload, handleResult);
                    },
                };
            });
        },
    };
};
