import { DocumentNode } from 'graphql';
import { PersistedOperationsStore } from '../types.js';
export type JsonFileStoreDataMap = Map<string, DocumentNode | string>;
export declare class JsonFileStore implements PersistedOperationsStore {
    private storeData;
    get(operationId: string): string | DocumentNode | undefined;
    loadFromFileSync(path: string): void;
    loadFromFile(path: string): Promise<void>;
}
