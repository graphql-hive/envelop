import { Plugin } from '@envelop/core';
import { AllowedOperations, createFilterOperationTypeRule } from './filter-operation-type-rule.js';
export { AllowedOperations };
export declare const useFilterAllowedOperations: (allowedOperations: AllowedOperations) => Plugin;
export { createFilterOperationTypeRule };
