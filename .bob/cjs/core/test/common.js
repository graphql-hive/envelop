"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriptionOperationString = exports.query = exports.schema = void 0;
const schema_1 = require("@graphql-tools/schema");
exports.schema = (0, schema_1.makeExecutableSchema)({
    typeDefs: /* GraphQL */ `
    type Query {
      me: User!
      alphabet: [String]!
    }
    type User {
      id: ID!
      name: String!
    }

    type Subscription {
      alphabet: String!
      message: String!
    }
  `,
    resolvers: {
        Query: {
            me: () => {
                return { _id: 1, firstName: 'Dotan', lastName: 'Simha' };
            },
        },
        Subscription: {
            message: {
                subscribe: (_, __, context) => {
                    if (!context || 'subscribeSource' in context === false) {
                        throw new Error('No subscribeSource provided for context :(');
                    }
                    return context.subscribeSource;
                },
                resolve: (_, __, context) => context.message,
            },
        },
        User: {
            id: u => u._id,
            name: u => `${u.firstName} ${u.lastName}`,
        },
    },
});
exports.query = `
  query me {
    me {
      id
      name
    }
  }
`;
exports.subscriptionOperationString = `
  subscription {
    message
  }
`;
