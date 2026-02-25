"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useDataLoader = void 0;
const useDataLoader = (name, builderFn) => {
    return {
        onContextBuilding({ context, extendContext }) {
            extendContext({
                [name]: builderFn(context),
            });
        },
    };
};
exports.useDataLoader = useDataLoader;
