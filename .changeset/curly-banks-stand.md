---
'@envelop/core': patch
---

Fixes `onFetch` hook not having the `state` attribute in payload on non-upstream `fetch` calls.
