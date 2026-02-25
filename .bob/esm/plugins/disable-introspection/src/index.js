import { NoSchemaIntrospectionCustomRule } from 'graphql';
export const useDisableIntrospection = (options) => {
    const disableIf = options?.disableIf;
    return {
        onValidate: disableIf
            ? ({ addValidationRule, context, params }) => {
                if (disableIf({ context, params })) {
                    addValidationRule(NoSchemaIntrospectionCustomRule);
                }
            }
            : ({ addValidationRule }) => {
                addValidationRule(NoSchemaIntrospectionCustomRule);
            },
    };
};
