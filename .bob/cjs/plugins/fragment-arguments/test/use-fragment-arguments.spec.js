"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_tags_1 = require("common-tags");
const graphql_1 = require("graphql");
const jest_diff_1 = require("jest-diff");
const core_1 = require("@envelop/core");
const testing_1 = require("@envelop/testing");
const index_js_1 = require("../src/index.js");
function compareStrings(a, b) {
    return a.includes(b);
}
expect.extend({
    toBeSimilarStringTo(received, expected) {
        const strippedReceived = (0, common_tags_1.oneLine) `${received}`.replace(/\s\s+/g, ' ');
        const strippedExpected = (0, common_tags_1.oneLine) `${expected}`.replace(/\s\s+/g, ' ');
        if (compareStrings(strippedReceived, strippedExpected)) {
            return {
                message: () => `expected 
   ${received}
   not to be a string containing (ignoring indents)
   ${expected}`,
                pass: true,
            };
        }
        else {
            const diffString = (0, jest_diff_1.diff)((0, common_tags_1.stripIndent) `${expected}`, (0, common_tags_1.stripIndent) `${received}`, {
                expand: this.expand,
            });
            const hasExpect = diffString && diffString.includes('- Expect');
            const message = hasExpect
                ? `Difference:\n\n${diffString}`
                : `expected 
      ${received}
      to be a string containing (ignoring indents)
      ${expected}`;
            return {
                message: () => message,
                pass: false,
            };
        }
    },
});
describe('useFragmentArguments', () => {
    const schema = (0, graphql_1.buildSchema)(/* GraphQL */ `
    type Query {
      a: TestType
    }

    type TestType {
      a(b: String): Boolean
    }
  `);
    test('can inline fragment with argument', () => {
        const { parse } = (0, core_1.envelop)({
            plugins: [(0, testing_1.useGraphQLJSEngine)(), (0, index_js_1.useFragmentArguments)(), (0, core_1.useSchema)(schema)],
        })({});
        const result = parse(/* GraphQL */ `
      fragment TestFragment($c: String) on Query {
        a(b: $c)
      }

      query TestQuery($a: String) {
          ...TestFragment(c: $a)
      }
    `);
        expect((0, graphql_1.print)(result)).toBeSimilarStringTo(/* GraphQL */ `
      query TestQuery($a: String) {
        ... on Query {
          a(b: $a)
        }
      }
    `);
    });
});
