---
"@module-federation/nuxt": patch
---

Fix client-only remote components (`ssr: false`) throwing during route navigation. The generated wrapper rendered `null` until mounted, so Nuxt's own client-only wrapper received no VNode during route updates.
