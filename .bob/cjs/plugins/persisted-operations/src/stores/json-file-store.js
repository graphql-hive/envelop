"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonFileStore = void 0;
const fs_1 = require("fs");
class JsonFileStore {
    storeData = null;
    get(operationId) {
        if (!this.storeData) {
            return undefined;
        }
        return this.storeData.get(operationId) || undefined;
    }
    loadFromFileSync(path) {
        const data = JSON.parse((0, fs_1.readFileSync)(path, 'utf-8'));
        this.storeData = new Map(Object.entries(data));
    }
    loadFromFile(path) {
        return fs_1.promises.readFile(path, 'utf-8').then(data => {
            this.storeData = new Map(Object.entries(JSON.parse(data)));
        });
    }
}
exports.JsonFileStore = JsonFileStore;
