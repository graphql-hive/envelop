"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FragmentArgumentCompatibleParser = void 0;
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
const graphql_1 = require("graphql");
const parser_js_1 = require("graphql/language/parser.js");
class FragmentArgumentCompatibleParser extends parser_js_1.Parser {
    // see https://github.com/graphql/graphql-js/pull/3248
    getLexer() {
        return this._lexer;
    }
    // see https://github.com/graphql/graphql-js/pull/3248
    getOptions() {
        return this._options;
    }
    // for backwards-compat with v15, this api was removed in v16 in favor of the this.node API.
    loc(startToken) {
        if (this.getOptions()?.noLocation !== true) {
            const lexer = this.getLexer();
            return new graphql_1.Location(startToken, lexer.lastToken, lexer.source);
        }
        return undefined;
    }
    parseFragment() {
        const start = this.getLexer().token;
        this.expectToken(graphql_1.TokenKind.SPREAD);
        const hasTypeCondition = this.expectOptionalKeyword('on');
        if (!hasTypeCondition && this.peek(graphql_1.TokenKind.NAME)) {
            const name = this.parseFragmentName();
            if (this.peek(graphql_1.TokenKind.PAREN_L)) {
                return {
                    kind: graphql_1.Kind.FRAGMENT_SPREAD,
                    name,
                    arguments: this.parseArguments(),
                    directives: this.parseDirectives(),
                    loc: this.loc(start),
                };
            }
            return {
                kind: graphql_1.Kind.FRAGMENT_SPREAD,
                name: this.parseFragmentName(),
                directives: this.parseDirectives(),
                loc: this.loc(start),
            };
        }
        return {
            kind: graphql_1.Kind.INLINE_FRAGMENT,
            typeCondition: hasTypeCondition ? this.parseNamedType() : undefined,
            directives: this.parseDirectives(),
            selectionSet: this.parseSelectionSet(),
            loc: this.loc(start),
        };
    }
    parseFragmentDefinition() {
        const start = this.getLexer().token;
        this.expectKeyword('fragment');
        const name = this.parseFragmentName();
        if (this.peek(graphql_1.TokenKind.PAREN_L)) {
            const fragmentDefinition = {
                kind: graphql_1.Kind.FRAGMENT_DEFINITION,
                name,
                variableDefinitions: this.parseVariableDefinitions(),
                typeCondition: (this.expectKeyword('on'), this.parseNamedType()),
                directives: this.parseDirectives(),
                selectionSet: this.parseSelectionSet(),
                loc: this.loc(start),
            };
            return fragmentDefinition;
        }
        const fragmentDefinition = {
            kind: graphql_1.Kind.FRAGMENT_DEFINITION,
            name,
            typeCondition: (this.expectKeyword('on'), this.parseNamedType()),
            directives: this.parseDirectives(),
            selectionSet: this.parseSelectionSet(),
            loc: this.loc(start),
        };
        return fragmentDefinition;
    }
}
exports.FragmentArgumentCompatibleParser = FragmentArgumentCompatibleParser;
