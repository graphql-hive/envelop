---
'@envelop/core': patch
---

Fix getters and setters being stripped away. The value was copied at plugin creation instead of
copying the getter and setter (if any).
