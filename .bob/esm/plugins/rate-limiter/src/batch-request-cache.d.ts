export declare const getNoOpCache: () => {
    set: ({ newTimestamps }: {
        newTimestamps: number[];
    }) => number[];
};
export declare const getWeakMapCache: () => {
    set: ({ context, fieldIdentity, newTimestamps, }: {
        context: Record<any, any>;
        fieldIdentity: string;
        newTimestamps: number[];
    }) => any;
};
