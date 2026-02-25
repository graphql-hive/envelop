import { DefaultContext, Plugin } from '@envelop/core';
export interface DisableIntrospectionOptions {
    disableIf?: (args: {
        context: DefaultContext;
        params: Parameters<NonNullable<Plugin['onValidate']>>[0]['params'];
    }) => boolean;
}
export declare const useDisableIntrospection: (options?: DisableIntrospectionOptions) => Plugin;
