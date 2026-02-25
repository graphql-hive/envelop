"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useResourceLimitations = exports.ResourceLimitationValidationRule = exports.defaultPaginationArgumentMinimum = exports.defaultPaginationArgumentMaximum = exports.defaultNodeCostLimit = void 0;
const graphql_1 = require("graphql");
const core_1 = require("@envelop/core");
const extended_validation_1 = require("@envelop/extended-validation");
const utils_1 = require("@graphql-tools/utils");
const getWrappedType = (graphqlType) => {
    if (graphqlType instanceof graphql_1.GraphQLList || graphqlType instanceof graphql_1.GraphQLNonNull) {
        return getWrappedType(graphqlType.ofType);
    }
    return graphqlType;
};
const isValidArgType = (type, paginationArgumentTypes) => type === graphql_1.GraphQLInt ||
    ((0, graphql_1.isScalarType)(type) && !!paginationArgumentTypes && paginationArgumentTypes.includes(type.name));
const hasFieldDefConnectionArgs = (field, argumentTypes) => {
    let hasFirst = false;
    let hasLast = false;
    for (const arg of field.args) {
        if (arg.name === 'first' && isValidArgType(arg.type, argumentTypes)) {
            hasFirst = true;
        }
        else if (arg.name === 'last' && isValidArgType(arg.type, argumentTypes)) {
            hasLast = true;
        }
        else if (hasLast && hasFirst) {
            break;
        }
    }
    return { hasFirst, hasLast };
};
const buildMissingPaginationFieldErrorMessage = (params) => `Missing pagination argument for field '${params.fieldName}'. ` +
    `Please provide ` +
    (params.hasFirst && params.hasLast
        ? "either the 'first' or 'last'"
        : params.hasFirst
            ? "the 'first'"
            : "the 'last'") +
    ' field argument.';
const buildInvalidPaginationRangeErrorMessage = (params) => `Invalid pagination argument for field '${params.fieldName}'. ` +
    `The value for the '${params.argumentName}' argument must be an integer within ${params.paginationArgumentMinimum}-${params.paginationArgumentMaximum}.`;
exports.defaultNodeCostLimit = 500000;
exports.defaultPaginationArgumentMaximum = 100;
exports.defaultPaginationArgumentMinimum = 1;
/**
 * Validate whether a user is allowed to execute a certain GraphQL operation.
 */
const ResourceLimitationValidationRule = (params) => (context, executionArgs) => {
    const { paginationArgumentMaximum, paginationArgumentMinimum } = params;
    const nodeCostStack = [];
    let totalNodeCost = 0;
    const connectionFieldMap = new WeakSet();
    return {
        Field: {
            enter(fieldNode) {
                const fieldDef = context.getFieldDef();
                // if it is not found the query is invalid and graphql validation will complain
                if (fieldDef != null) {
                    const argumentValues = (0, utils_1.getArgumentValues)(fieldDef, fieldNode, executionArgs.variableValues || undefined);
                    const type = getWrappedType(fieldDef.type);
                    if (type instanceof graphql_1.GraphQLObjectType && type.name.endsWith('Connection')) {
                        let nodeCost = 1;
                        connectionFieldMap.add(fieldNode);
                        const { hasFirst, hasLast } = hasFieldDefConnectionArgs(fieldDef, params.paginationArgumentTypes);
                        if (hasFirst === false && hasLast === false) {
                            // eslint-disable-next-line no-console
                            console.warn('Encountered paginated field without pagination arguments.');
                        }
                        else if (hasFirst === true || hasLast === true) {
                            if (('first' in argumentValues === false && 'last' in argumentValues === false) ||
                                (argumentValues.first === null && argumentValues.last === null)) {
                                context.reportError(new graphql_1.GraphQLError(buildMissingPaginationFieldErrorMessage({
                                    fieldName: fieldDef.name,
                                    hasFirst,
                                    hasLast,
                                }), fieldNode));
                            }
                            else if ('first' in argumentValues && !argumentValues.last) {
                                if (argumentValues.first < paginationArgumentMinimum ||
                                    argumentValues.first > paginationArgumentMaximum) {
                                    context.reportError(new graphql_1.GraphQLError(buildInvalidPaginationRangeErrorMessage({
                                        paginationArgumentMaximum,
                                        paginationArgumentMinimum,
                                        argumentName: 'first',
                                        fieldName: fieldDef.name,
                                    }), fieldNode));
                                }
                                else {
                                    // eslint-disable-next-line dot-notation
                                    nodeCost = argumentValues['first'];
                                }
                            }
                            else if (!argumentValues.first && 'last' in argumentValues) {
                                if (argumentValues.last < paginationArgumentMinimum ||
                                    argumentValues.last > paginationArgumentMaximum) {
                                    context.reportError(new graphql_1.GraphQLError(buildInvalidPaginationRangeErrorMessage({
                                        paginationArgumentMaximum,
                                        paginationArgumentMinimum,
                                        argumentName: 'last',
                                        fieldName: fieldDef.name,
                                    }), fieldNode));
                                }
                                else {
                                    // eslint-disable-next-line dot-notation
                                    nodeCost = argumentValues['last'];
                                }
                            }
                            else {
                                context.reportError(new graphql_1.GraphQLError(buildMissingPaginationFieldErrorMessage({
                                    fieldName: fieldDef.name,
                                    hasFirst,
                                    hasLast,
                                }), fieldNode));
                            }
                        }
                        nodeCostStack.push(nodeCost);
                    }
                }
            },
            leave(node) {
                if (connectionFieldMap.delete(node)) {
                    totalNodeCost = totalNodeCost + nodeCostStack.reduce((a, b) => a * b, 1);
                    nodeCostStack.pop();
                }
            },
        },
        Document: {
            leave(documentNode) {
                if (totalNodeCost === 0) {
                    totalNodeCost = 1;
                }
                if (totalNodeCost > params.nodeCostLimit) {
                    context.reportError(new graphql_1.GraphQLError(`Cannot request more than ${params.nodeCostLimit} nodes in a single document. Please split your operation into multiple sub operations or reduce the amount of requested nodes.`, documentNode));
                }
                params.reportNodeCost?.(totalNodeCost, executionArgs);
            },
        },
    };
};
exports.ResourceLimitationValidationRule = ResourceLimitationValidationRule;
const useResourceLimitations = (params) => {
    const paginationArgumentMaximum = params?.paginationArgumentMaximum ?? exports.defaultPaginationArgumentMaximum;
    const paginationArgumentMinimum = params?.paginationArgumentMinimum ?? exports.defaultPaginationArgumentMinimum;
    const nodeCostLimit = params?.nodeCostLimit ?? exports.defaultNodeCostLimit;
    const extensions = params?.extensions ?? false;
    const nodeCostMap = new WeakMap();
    const handleResult = ({ result, args }) => {
        const nodeCost = nodeCostMap.get(args);
        if (nodeCost != null) {
            result.extensions = {
                ...result.extensions,
                resourceLimitations: {
                    nodeCost,
                },
            };
        }
    };
    return {
        onPluginInit({ addPlugin }) {
            addPlugin((0, extended_validation_1.useExtendedValidation)({
                rules: [
                    (0, exports.ResourceLimitationValidationRule)({
                        nodeCostLimit,
                        paginationArgumentMaximum,
                        paginationArgumentMinimum,
                        paginationArgumentTypes: params?.paginationArgumentScalars,
                        reportNodeCost: extensions
                            ? (nodeCost, ref) => {
                                nodeCostMap.set(ref, nodeCost);
                            }
                            : undefined,
                    }),
                ],
                onValidationFailed: params => handleResult(params),
            }));
        },
        onExecute({ args }) {
            return {
                onExecuteDone(payload) {
                    return (0, core_1.handleStreamOrSingleExecutionResult)(payload, ({ result }) => handleResult({ result, args }));
                },
            };
        },
    };
};
exports.useResourceLimitations = useResourceLimitations;
