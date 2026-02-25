"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasInlineArgument = hasInlineArgument;
const graphql_1 = require("graphql");
function hasInlineArgument(doc) {
    let seen = false;
    const leave = () => {
        seen = true;
        return graphql_1.BREAK;
    };
    (0, graphql_1.visit)(doc, {
        StringValue: {
            leave,
        },
        BooleanValue: {
            leave,
        },
        FloatValue: {
            leave,
        },
        EnumValue: {
            leave,
        },
        IntValue: {
            leave,
        },
    });
    return seen;
}
