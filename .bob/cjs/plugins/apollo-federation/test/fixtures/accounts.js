"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schema = exports.typeDefs = void 0;
const tslib_1 = require("tslib");
const graphql_tag_1 = tslib_1.__importDefault(require("graphql-tag"));
const subgraph_1 = require("@apollo/subgraph");
const users = [
    {
        id: '1',
        name: 'Ada Lovelace',
        birthDate: '1815-12-10',
        username: '@ada',
    },
    {
        id: '2',
        name: 'Alan Turing',
        birthDate: '1912-06-23',
        username: '@complete',
    },
];
exports.typeDefs = (0, graphql_tag_1.default) `
  extend type Query {
    me: User
    user(id: ID!): User
    users: [User]
  }

  type User @key(fields: "id") {
    id: ID!
    name: String
    username: String!
    birthDate: String
  }
`;
exports.schema = (0, subgraph_1.buildSubgraphSchema)({
    typeDefs: exports.typeDefs,
    resolvers: {
        Query: {
            me: () => users[0],
            users: () => users,
            user: (_, { id }) => users.find(user => user.id === id),
        },
        User: {
            __resolveReference: ({ id }) => users.find(user => user.id === id),
        },
    },
});
