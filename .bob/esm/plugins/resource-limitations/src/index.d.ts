import { ExecutionArgs } from 'graphql';
import { Plugin } from '@envelop/core';
import { ExtendedValidationRule } from '@envelop/extended-validation';
export declare const defaultNodeCostLimit = 500000;
export declare const defaultPaginationArgumentMaximum = 100;
export declare const defaultPaginationArgumentMinimum = 1;
export type ResourceLimitationValidationRuleParams = {
    nodeCostLimit: number;
    paginationArgumentMaximum: number;
    paginationArgumentMinimum: number;
    paginationArgumentTypes?: string[];
    reportNodeCost?: (cost: number, executionArgs: ExecutionArgs) => void;
};
/**
 * Validate whether a user is allowed to execute a certain GraphQL operation.
 */
export declare const ResourceLimitationValidationRule: (params: ResourceLimitationValidationRuleParams) => ExtendedValidationRule;
type UseResourceLimitationsParams = {
    /**
     * The node cost limit for rejecting a operation.
     * @default 500000
     */
    nodeCostLimit?: number;
    /**
     * The custom scalar types accepted for connection arguments.
     */
    paginationArgumentScalars?: string[];
    /**
     * The maximum value accepted for connection arguments.
     * @default 100
     */
    paginationArgumentMaximum?: number;
    /**
     * The minimum value accepted for connection arguments.
     * @default 1
     */
    paginationArgumentMinimum?: number;
    /**
     * Whether the resourceLimitations.nodeCost field should be included within the execution result extensions map.
     * @default false
     */
    extensions?: boolean;
};
export declare const useResourceLimitations: (params?: UseResourceLimitationsParams) => Plugin;
export {};
