import { DefaultContext, Plugin } from '@envelop/core';
import { PersistedOperationsFunctionStore, PersistedOperationsStore } from './types.js';
export type UsePersistedOperationsOptions<ContextType = DefaultContext> = {
    /**
     * Set to `false` to allow running operations that are not available in the store.
     * Set to `true` to allow running only persisted operations.
     */
    onlyPersisted?: boolean;
    /**
     * The store to use. You can implement a store that loads data from any source.
     * You can even support multiple stores and implement a function that returns one of those stores based on context values.
     */
    store: PersistedOperationsStore | PersistedOperationsFunctionStore<ContextType>;
    /**
     * Function that returns the operation id, e.g. by retrieving it from custom properties within context
     */
    extractOperationId?: (context: Readonly<ContextType>) => string | undefined;
    /**
     * Callback function to notify consumer of missing hash match, f.i. to log, monitor and/or analyse these events
     */
    onMissingMatch?: (context: Readonly<ContextType>, operationId: string) => void;
};
declare const contextProperty: unique symbol;
export type PersistedOperationPluginContext = {
    [contextProperty]: string;
};
export declare function readOperationId(context: PersistedOperationPluginContext): string;
export declare const usePersistedOperations: (rawOptions: UsePersistedOperationsOptions) => Plugin<PersistedOperationPluginContext>;
export {};
