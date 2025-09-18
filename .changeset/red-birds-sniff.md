---
'@envelop/rate-limiter': major
---

Rate Limiter no longer gets attached to the resolvers and use `onExecute` hook instead.
This improves performance by reducing the number of function calls, and issues with multiple plugins trying to wrap the same resolver.

`onRateLimitError` no longer receives `info` object, but receives `type` and `field` instead.
`interpolateMessage` also receives `type` and `field` instead of `info`.

```diff
onRateLimitError({
    error: string;
    identifier: string;
    context: unknown;
-   info: GraphQLResolveInfo;
+   type: GraphQLNamedOutputType;
+   field: GraphQLField<any, any>;
})
```

```diff
interpolateMessage(
    message: string,
    identifier: string,
    params: {
        root: unknown;
        args: Record<string, unknown>;
        context: unknown;
-       info: GraphQLResolveInfo;
+       type: GraphQLNamedOutputType;
+       field: GraphQLField<any, any>;
    }
): string
```