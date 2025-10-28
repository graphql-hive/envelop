import { parse, print } from 'graphql';
import { sanitizeDocument } from '../src/utils';

it('removes inline fragment spreads that are empty', () => {
  const document = parse(/* GraphQL */ `
    {
      name
      ... on Admin {
        email
      }
    }
  `);

  // @ts-expect-error break it
  document.definitions[0].selectionSet.selections[1].selectionSet.selections = [];

  expect(print(document)).toMatchInlineSnapshot(`
   "{
     name
     ... on Admin
   }"
  `);

  const sanitized = sanitizeDocument(document);
  expect(print(sanitized)).toMatchInlineSnapshot(`
   "{
     name
   }"
  `);
});

it('removes inline fragment spreads and parent field when empty', () => {
  const document = parse(
    /* GraphQL */ `
      {
        name
        person {
          ... on Admin {
            email
          }
        }
      }
    `,
    { noLocation: true },
  );

  // @ts-expect-error break it
  document.definitions[0].selectionSet.selections[1].selectionSet.selections[0].selectionSet.selections =
    [];

  expect(print(document)).toMatchInlineSnapshot(`
   "{
     name
     person {
       ... on Admin
     }
   }"
  `);

  const sanitized = sanitizeDocument(document);
  expect(print(sanitized)).toMatchInlineSnapshot(`
   "{
     name
   }"
  `);
});

it('removes fragment spreads that reference empty fragments with leftover empty parent field', () => {
  const document = parse(/* GraphQL */ `
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

  expect(print(document)).toMatchInlineSnapshot(`
   "{
     name
     person {
       ...A
     }
   }

   fragment A on Admin "
  `);

  const sanitized = sanitizeDocument(document);
  expect(print(sanitized)).toMatchInlineSnapshot(`
   "{
     name
   }"
  `);
});
