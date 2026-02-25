"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildOperationKey = buildOperationKey;
exports.buildEntityKey = buildEntityKey;
function buildOperationKey(operationId, keyPrefix = undefined) {
    if (keyPrefix) {
        return `${keyPrefix}:operation:${operationId}`;
    }
    else {
        return `operation:${operationId}`;
    }
}
function buildEntityKey(entityTypename, entityId = undefined, keyPrefix = undefined) {
    let finalKey = keyPrefix ? `${keyPrefix}:` : '';
    if (entityId) {
        finalKey += `entity:${entityTypename}:${entityId}`;
    }
    else {
        finalKey += `entity:${entityTypename}`;
    }
    return finalKey;
}
