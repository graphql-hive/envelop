"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useDisableIntrospection = void 0;
const graphql_1 = require("graphql");
const useDisableIntrospection = (options) => {
    const disableIf = options?.disableIf;
    return {
        onValidate: disableIf
            ? ({ addValidationRule, context, params }) => {
                if (disableIf({ context, params })) {
                    addValidationRule(graphql_1.NoSchemaIntrospectionCustomRule);
                }
            }
            : ({ addValidationRule }) => {
                addValidationRule(graphql_1.NoSchemaIntrospectionCustomRule);
            },
    };
};
exports.useDisableIntrospection = useDisableIntrospection;
