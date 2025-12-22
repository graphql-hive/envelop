---
'@envelop/response-cache': minor
---

Add `ignoreSessionIdForPublicScope` option, allowing to optimize cache hit of public data.

## Usage

The new `ignoreSessionIdForPublicScope` allows to use a cache key that ignores the session ID when
the response scope is `PUBLIC`. This allows to share cached responses between all users, even on
authenticated requests.

Enabling this feature requires to carefully set the scope across you schema to avoid any private
data leak. For this reason, the option is disabled by default.

> Note: When enabled, `buildResponseCacheKey` can be called twice for the same graphql operation.

```ts
import { envelop } from '@envelop/core'
import { useResponseCache } from '@envelop/response-cache'

const getEnveloped = envelop({
  plugins: [
    useResponseCache({
      sessionId: ({ request }) => request.headers.get('authorization'),
      ignoreSessionIdForPublicScope: true
    })
  ]
})
```
