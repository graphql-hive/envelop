"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFilterOperationTypeRule = exports.useFilterAllowedOperations = void 0;
const filter_operation_type_rule_js_1 = require("./filter-operation-type-rule.js");
Object.defineProperty(exports, "createFilterOperationTypeRule", { enumerable: true, get: function () { return filter_operation_type_rule_js_1.createFilterOperationTypeRule; } });
const useFilterAllowedOperations = (allowedOperations) => {
    return {
        onValidate: ({ addValidationRule }) => {
            addValidationRule((0, filter_operation_type_rule_js_1.createFilterOperationTypeRule)(allowedOperations));
        },
    };
};
exports.useFilterAllowedOperations = useFilterAllowedOperations;
