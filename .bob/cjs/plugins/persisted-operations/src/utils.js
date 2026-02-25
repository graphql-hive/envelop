"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.operationIdFromSource = operationIdFromSource;
function operationIdFromSource(source) {
    return typeof source === 'string' && source.length && source.indexOf('{') === -1
        ? source
        : undefined;
}
