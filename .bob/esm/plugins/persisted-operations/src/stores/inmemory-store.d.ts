import { DocumentNode } from 'graphql';
import { PersistedOperationsStore } from '../types.js';
export type InMemoryStoreDataMap = Map<string, DocumentNode | string>;
export declare class InMemoryStore implements PersistedOperationsStore {
    private storeData;
    constructor(options?: {
        initialData?: InMemoryStoreDataMap;
    });
    get(operationId: string): string | DocumentNode | undefined;
    prime(operationId: string, document: string | DocumentNode): void;
    clear(operationId: string): void;
}
