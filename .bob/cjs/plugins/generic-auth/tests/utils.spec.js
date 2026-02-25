"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const utils_1 = require("../src/utils");
it('removes inline fragment spreads that are empty', () => {
    const document = (0, graphql_1.parse)(/* GraphQL */ `
    {
      name
      ... on Admin {
        email
      }
    }
  `);
    // @ts-expect-error break it
    document.definitions[0].selectionSet.selections[1].selectionSet.selections = [];
    expect((0, graphql_1.print)(document).trim()).toMatchInlineSnapshot(`
   "{
     name
     ... on Admin
   }"
  `);
    const sanitized = (0, utils_1.removeEmptyOrUnusedNodes)(document);
    expect((0, graphql_1.print)(sanitized).trim()).toMatchInlineSnapshot(`
   "{
     name
   }"
  `);
});
it('empties the whole document when no fields remain', () => {
    const document = (0, graphql_1.parse)(/* GraphQL */ `
    {
      ... on Admin {
        email
      }
    }
  `);
    // @ts-expect-error break it
    document.definitions[0].selectionSet.selections[0].selectionSet.selections = [];
    expect((0, graphql_1.print)(document).trim()).toMatchInlineSnapshot(`
   "{
     ... on Admin
   }"
  `);
    const sanitized = (0, utils_1.removeEmptyOrUnusedNodes)(document);
    expect((0, graphql_1.print)(sanitized).trim()).toBe('');
});
it('removes inline fragment spreads and parent field when empty', () => {
    const document = (0, graphql_1.parse)(
    /* GraphQL */ `
      {
        name
        person {
          ... on Admin {
            email
          }
        }
      }
    `, { noLocation: true });
    // @ts-expect-error break it
    document.definitions[0].selectionSet.selections[1].selectionSet.selections[0].selectionSet.selections =
        [];
    expect((0, graphql_1.print)(document).trim()).toMatchInlineSnapshot(`
   "{
     name
     person {
       ... on Admin
     }
   }"
  `);
    const sanitized = (0, utils_1.removeEmptyOrUnusedNodes)(document);
    expect((0, graphql_1.print)(sanitized).trim()).toMatchInlineSnapshot(`
   "{
     name
   }"
  `);
});
it('removes fragment spreads that reference empty fragments with leftover empty parent field', () => {
    const document = (0, graphql_1.parse)(/* GraphQL */ `
    {
      name
      person {
        ...A
      }
    }
    fragment A on Admin {
      email
    }
  `);
    // @ts-expect-error break it
    document.definitions[1].selectionSet.selections = [];
    expect((0, graphql_1.print)(document).trim()).toMatchInlineSnapshot(`
   "{
     name
     person {
       ...A
     }
   }

   fragment A on Admin"
  `);
    const sanitized = (0, utils_1.removeEmptyOrUnusedNodes)(document);
    expect((0, graphql_1.print)(sanitized).trim()).toMatchInlineSnapshot(`
   "{
     name
   }"
  `);
});
it('removes nested inline fragments and bubbles to parent field', () => {
    const document = (0, graphql_1.parse)(/* GraphQL */ `
    {
      user {
        name
        profile {
          ... on Admin {
            settings {
              ... on Admin {
                theme
              }
            }
          }
        }
      }
    }
  `);
    // @ts-expect-error break it
    document.definitions[0].selectionSet.selections[0].selectionSet.selections[1].selectionSet.selections[0].selectionSet.selections[0].selectionSet.selections[0].selectionSet.selections =
        [];
    expect((0, graphql_1.print)(document).trim()).toMatchInlineSnapshot(`
   "{
     user {
       name
       profile {
         ... on Admin {
           settings {
             ... on Admin
           }
         }
       }
     }
   }"
  `);
    const sanitized = (0, utils_1.removeEmptyOrUnusedNodes)(document);
    expect((0, graphql_1.print)(sanitized).trim()).toMatchInlineSnapshot(`
   "{
     user {
       name
     }
   }"
  `);
});
it('recursively removes fragments referencing other fragments that are empty', () => {
    const document = (0, graphql_1.parse)(/* GraphQL */ `
    {
      hello
      user {
        ...A
      }
    }
    fragment A on User {
      ...B
    }
    fragment B on User {
      name
    }
  `);
    // @ts-expect-error break it
    document.definitions[2].selectionSet.selections = [];
    expect((0, graphql_1.print)(document).trim()).toMatchInlineSnapshot(`
   "{
     hello
     user {
       ...A
     }
   }

   fragment A on User {
     ...B
   }

   fragment B on User"
  `);
    const sanitized = (0, utils_1.removeEmptyOrUnusedNodes)(document);
    expect((0, graphql_1.print)(sanitized).trim()).toMatchInlineSnapshot(`
   "{
     hello
   }"
  `);
});
it('removes unused fragment definitions', () => {
    const document = (0, graphql_1.parse)(/* GraphQL */ `
    {
      name
    }
    fragment A on Admin {
      email
    }
    fragment B on User {
      name
    }
  `);
    const sanitized = (0, utils_1.removeEmptyOrUnusedNodes)(document);
    expect((0, graphql_1.print)(sanitized).trim()).toMatchInlineSnapshot(`
   "{
     name
   }"
  `);
});
it('removes all fields referencing empty fragments', () => {
    const document = (0, graphql_1.parse)(/* GraphQL */ `
    {
      hello
      admin {
        ...A
      }
      user {
        ...A
      }
    }
    fragment A on Admin {
      name
    }
  `);
    // @ts-expect-error break it
    document.definitions[1].selectionSet.selections = [];
    expect((0, graphql_1.print)(document).trim()).toMatchInlineSnapshot(`
   "{
     hello
     admin {
       ...A
     }
     user {
       ...A
     }
   }

   fragment A on Admin"
  `);
    const sanitized = (0, utils_1.removeEmptyOrUnusedNodes)(document);
    expect((0, graphql_1.print)(sanitized).trim()).toMatchInlineSnapshot(`
   "{
     hello
   }"
  `);
});
