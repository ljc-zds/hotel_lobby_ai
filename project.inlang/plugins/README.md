# Vendored translation plugin

`message-format.js` is the unmodified ESM bundle from
`https://cdn.jsdelivr.net/npm/@inlang/plugin-message-format@4.4.5/dist/index.js`.
It is the existing Inlang message format plugin, now loaded from disk so offline
builds do not silently produce an empty translation registry.

Upstream: https://github.com/opral/inlang/tree/main/packages/plugins/inlang-message-format.
Vendored release: `@inlang/plugin-message-format` 4.4.5.
When upgrading, replace this bundle with an official release and run
`pnpm build` (which includes `check:translations`).
