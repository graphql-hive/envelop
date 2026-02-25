"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashSHA256 = hashSHA256;
const fetch_1 = require("@whatwg-node/fetch");
const promise_helpers_1 = require("@whatwg-node/promise-helpers");
function hashSHA256(text) {
    const inputUint8Array = new fetch_1.TextEncoder().encode(text);
    return (0, promise_helpers_1.handleMaybePromise)(() => fetch_1.crypto.subtle.digest({ name: 'SHA-256' }, inputUint8Array), arrayBuf => {
        const outputUint8Array = new Uint8Array(arrayBuf);
        let hash = '';
        for (let i = 0, l = outputUint8Array.length; i < l; i++) {
            const hex = outputUint8Array[i].toString(16);
            hash += '00'.slice(0, Math.max(0, 2 - hex.length)) + hex;
        }
        return hash;
    });
}
