import { FragmentArgumentCompatibleParser } from './extended-parser.js';
import { applySelectionSetFragmentArguments } from './utils.js';
export function parseWithFragmentArguments(source, options) {
    const parser = new FragmentArgumentCompatibleParser(source, options);
    return parser.parseDocument();
}
export const useFragmentArguments = () => {
    return {
        onParse({ setParseFn }) {
            setParseFn(parseWithFragmentArguments);
            return ({ result, replaceParseResult }) => {
                if (result && 'kind' in result) {
                    replaceParseResult(applySelectionSetFragmentArguments(result));
                }
            };
        },
    };
};
