import { promises, readFileSync } from 'fs';
export class JsonFileStore {
    storeData = null;
    get(operationId) {
        if (!this.storeData) {
            return undefined;
        }
        return this.storeData.get(operationId) || undefined;
    }
    loadFromFileSync(path) {
        const data = JSON.parse(readFileSync(path, 'utf-8'));
        this.storeData = new Map(Object.entries(data));
    }
    loadFromFile(path) {
        return promises.readFile(path, 'utf-8').then(data => {
            this.storeData = new Map(Object.entries(JSON.parse(data)));
        });
    }
}
