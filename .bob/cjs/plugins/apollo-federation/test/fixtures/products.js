"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schema = exports.typeDefs = void 0;
const tslib_1 = require("tslib");
const graphql_tag_1 = tslib_1.__importDefault(require("graphql-tag"));
const subgraph_1 = require("@apollo/subgraph");
const products = [
    {
        upc: '1',
        name: 'Table',
        price: 899,
        weight: 100,
    },
    {
        upc: '2',
        name: 'Couch',
        price: 1299,
        weight: 1000,
    },
    {
        upc: '3',
        name: 'Chair',
        price: 54,
        weight: 50,
    },
];
exports.typeDefs = (0, graphql_tag_1.default) `
  extend type Query {
    topProducts(first: Int = 5): [Product]
  }

  type Product @key(fields: "upc") {
    upc: String!
    name: String
    price: Int
    weight: Int
  }
`;
exports.schema = (0, subgraph_1.buildSubgraphSchema)({
    typeDefs: exports.typeDefs,
    resolvers: {
        Product: {
            __resolveReference(object) {
                return products.find(product => product.upc === object.upc);
            },
        },
        Query: {
            topProducts(_, args) {
                return products.slice(0, args.first);
            },
        },
    },
});
