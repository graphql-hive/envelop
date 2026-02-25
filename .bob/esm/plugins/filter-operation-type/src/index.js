import { createFilterOperationTypeRule } from './filter-operation-type-rule.js';
export const useFilterAllowedOperations = (allowedOperations) => {
    return {
        onValidate: ({ addValidationRule }) => {
            addValidationRule(createFilterOperationTypeRule(allowedOperations));
        },
    };
};
export { createFilterOperationTypeRule };
