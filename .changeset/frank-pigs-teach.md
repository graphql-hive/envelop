---
'@envelop/on-resolve': minor
'@envelop/opentelemetry': minor
---

Add option to ignore default resolvers in opentelemetry instrumentation

To reduce telemetry data volume and noise in traces, it is recommended to ignore resolvers with the
default implementation since they probably doesn't do anything worth tracking.

## Usage

```ts
import { execute, parse, specifiedRules, subscribe, validate } from 'graphql'
import { envelop, useEngine } from '@envelop/core'
import { useOpenTelemetry } from '@envelop/opentelemetry'

const getEnveloped = envelop({
  plugins: [
    useEngine({ parse, validate, specifiedRules, execute, subscribe }),
    // ... other plugins ...

    useOpenTelemetry({
      resolvers: true,
      defaultResolvers: false // explicitly disable default resolvers tracing. Defaults to `true`
    })
  ]
})
```
