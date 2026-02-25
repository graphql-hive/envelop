"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useDepthLimit = void 0;
const tslib_1 = require("tslib");
const graphql_depth_limit_1 = tslib_1.__importDefault(require("graphql-depth-limit"));
const useDepthLimit = (config) => {
    const ignore = config.ignore || [];
    const checkFn = (0, graphql_depth_limit_1.default)(config.maxDepth, { ignore });
    return {
        onValidate({ addValidationRule }) {
            addValidationRule(checkFn);
        },
    };
};
exports.useDepthLimit = useDepthLimit;
