"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useFragmentArguments = void 0;
exports.parseWithFragmentArguments = parseWithFragmentArguments;
const extended_parser_js_1 = require("./extended-parser.js");
const utils_js_1 = require("./utils.js");
function parseWithFragmentArguments(source, options) {
    const parser = new extended_parser_js_1.FragmentArgumentCompatibleParser(source, options);
    return parser.parseDocument();
}
const useFragmentArguments = () => {
    return {
        onParse({ setParseFn }) {
            setParseFn(parseWithFragmentArguments);
            return ({ result, replaceParseResult }) => {
                if (result && 'kind' in result) {
                    replaceParseResult((0, utils_js_1.applySelectionSetFragmentArguments)(result));
                }
            };
        },
    };
};
exports.useFragmentArguments = useFragmentArguments;
