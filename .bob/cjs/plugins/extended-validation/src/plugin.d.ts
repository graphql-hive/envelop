import { DocumentNode, ExecutionArgs, ExecutionResult } from 'graphql';
import { Plugin } from '@envelop/core';
import { ExtendedValidationRule } from './common.js';
declare const symbolExtendedValidationRules: unique symbol;
type ExtendedValidationContext = {
    rules: Array<ExtendedValidationRule>;
    didRun: boolean;
};
type OnValidationFailedCallback = (params: {
    args: ExecutionArgs;
    result: ExecutionResult;
    setResult: (result: ExecutionResult) => void;
}) => void;
export declare const useExtendedValidation: <PluginContext extends Record<string, any> = {}>(options: {
    rules: Array<ExtendedValidationRule>;
    /**
     * Callback that is invoked when the document is assembled by the visitor.
     */
    onDocument?: (document: DocumentNode) => DocumentNode;
    /**
     * Callback that is invoked if the extended validation yields any errors.
     */
    onValidationFailed?: OnValidationFailedCallback;
    /**
     * Reject the execution if the validation fails.
     *
     * @default true
     */
    rejectOnErrors?: boolean;
}) => Plugin<PluginContext & {
    [symbolExtendedValidationRules]?: ExtendedValidationContext;
}>;
export {};
