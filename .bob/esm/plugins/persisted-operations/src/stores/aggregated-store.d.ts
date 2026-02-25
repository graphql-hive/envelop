import { DocumentNode } from 'graphql';
import { PersistedOperationsStore } from '../types.js';
export declare class AggregatedStore implements PersistedOperationsStore {
    private stores;
    constructor(stores: PersistedOperationsStore[]);
    get(operationId: string): string | DocumentNode | undefined;
}
