import { FragmentDefinitionNode, FragmentSpreadNode, InlineFragmentNode, Location, Token } from 'graphql';
import type { Lexer } from 'graphql/language/lexer.js';
import { ParseOptions, Parser } from 'graphql/language/parser.js';
export declare class FragmentArgumentCompatibleParser extends Parser {
    getLexer(): Lexer;
    getOptions(): ParseOptions;
    loc(startToken: Token): Location | undefined;
    parseFragment(): FragmentSpreadNode | InlineFragmentNode;
    parseFragmentDefinition(): FragmentDefinitionNode;
}
