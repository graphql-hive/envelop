---
'@envelop/rate-limiter': patch
---

Massive reduction of performance impact on GraphQL execution. Overhead has been minimalized on
rate-limited fields, and entirely suppressed on other fields.
