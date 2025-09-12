---
'@envelop/rate-limiter': minor
---

Validate the configuration at schema loading time. The plugin now throws an error on invalid
configuration, such as:

 - Multiple field configuration matching the same field
 - A field configuration matching a field already having a directive
