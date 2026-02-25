export class InMemoryStore {
    storeData;
    constructor(options) {
        this.storeData = options?.initialData ?? new Map();
    }
    get(operationId) {
        return this.storeData.get(operationId) || undefined;
    }
    prime(operationId, document) {
        this.storeData.set(operationId, document);
    }
    clear(operationId) {
        this.storeData.delete(operationId);
    }
}
