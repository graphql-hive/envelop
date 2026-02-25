import { BREAK, visit } from 'graphql';
export function hasInlineArgument(doc) {
    let seen = false;
    const leave = () => {
        seen = true;
        return BREAK;
    };
    visit(doc, {
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
