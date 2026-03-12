# Design: Update forms-engine-plugin and govuk-frontend

**Date:** 2026-03-12
**Status:** Approved

## Overview

Update the demo UI to be compatible with `@defra/forms-engine-plugin` v4.1.3 (from v0.1.6) and `govuk-frontend` v5.14.0 (from v5.7.1), and enable the GOV.UK King's Crown rebrand.

## Scope

Dependency upgrade and API alignment only. No new features.

## Changes

### 1. Dependency Updates (`package.json`)

| Package                      | From        | To        |
| ---------------------------- | ----------- | --------- |
| `@defra/forms-engine-plugin` | `^0.1.6`    | `^4.1.3`  |
| `govuk-frontend`             | `^5.7.1`    | `^5.14.0` |
| `hapi-pino`                  | `^12.1.0`   | `^13.0.0` |
| `@hapi/boom`                 | _(missing)_ | `^10.0.1` |

`hapi-pino` is bumped to `^13.0.0` to match what the plugin depends on. `@hapi/boom` is added as a direct dependency because `forms-service.js` imports it but it is absent from `package.json`.

### 2. Plugin Registration (`src/server/index.js`)

The v4 plugin requires new top-level options not present in v0.x. The existing `await server.register({ plugin, options: { services } })` call becomes:

```js
await server.register({
  plugin,
  options: {
    baseUrl: `http://localhost:${config.get('port')}`,
    cache: config.get('session.cache.name'),
    nunjucks: {
      // 'layouts/page.njk' is resolved by the plugin against the entries in `paths`
      baseLayoutPath: 'layouts/page.njk',
      // All paths are absolute, resolved from the project root
      paths: [
        path.resolve(config.get('root'), 'node_modules/govuk-frontend/dist'),
        path.resolve(config.get('root'), 'src/server/common/templates'),
        path.resolve(config.get('root'), 'src/server/common/components')
      ]
    },
    viewContext: (request) => ({
      serviceName: config.get('serviceName'),
      serviceUrl: '/',
      assetPath: `${config.get('assetPath')}/assets`
    }),
    services
  }
})
```

**Notes:**

- **crumb**: The plugin handles CSRF token injection into form `<form>` elements internally. `viewContext` does not need to provide it. The existing `context.js` for the host app's routes also does not include crumb — this is consistent.
- **`@hapi/crumb` must be registered before `forms-engine-plugin`**. The current order in `index.js` already satisfies this (crumb is in the first `server.register([...])` batch). Do not reorder plugin registration.
- **`baseUrl`**: For this demo, `http://localhost:{port}` is intentionally hardcoded. No `BASE_URL` config key is added. This is a known demo-only constraint. A production service would derive this from an environment variable.
- **`cache`** reads from `config.get('session.cache.name')` (defaults to `'session'`, configurable via `SESSION_CACHE_NAME`) to stay consistent with the rest of the codebase.
- **`nunjucks.paths`**: The plugin creates its own isolated Nunjucks environment from these paths. `govuk-frontend/dist` is listed first so `govuk/template.njk` and component macros resolve correctly. `layouts/page.njk` extends `govuk/template.njk` — this works because both path entries are present.
- **`getAssetPath`**: Omitted from `viewContext`. Plugin-rendered form templates do not call it. The host app's own routes get it from the existing `context.js`.

### 3. Forms Service (`src/server/forms-service.js`)

The `FormsService` interface expanded in v4. Three changes are required. The **export shape stays unchanged** (`export default { formsService }`).

**`getFormDefinition`** gains a second `state` parameter. The demo ignores it (prefix with `_` to satisfy lint):

```js
getFormDefinition: function (id, _state) { ... }
```

After install, annotate `_state` with the correct JSDoc type from `@defra/forms-engine-plugin/types` (the package exports types via `./types` per its `exports` field — verify the exact `FormStatus` export path post-install).

**`getFormMetadataById`** — new method, looks up by UUID:

```js
getFormMetadataById: function (id) {
  switch (id) {
    case metadata.id:
      return Promise.resolve(metadata)
    default:
      throw Boom.notFound(`Form '${id}' not found`)
  }
}
```

**`getFormSecret`** — new method, always throws for this demo:

```js
getFormSecret: function (formId, secretName) {
  throw Boom.notFound(`Secret '${secretName}' not found for form '${formId}'`)
}
```

After install, verify the exact parameter signature against the v4 `FormsService` type definition (the stub always throws so runtime behaviour is unaffected by order, but JSDoc annotations should match the interface).

### 4. Layout Template (`src/server/common/templates/layouts/page.njk`)

Remove `useTudorCrown: true` from the `govukHeader` call. Deprecated in govuk-frontend v5.3.0; King's Crown is now the default. The SCSS already has `$govuk-new-organisation-colours: true`.

**Before:**

```njk
{{ govukHeader({
  homepageUrl: "https://www.gov.uk/",
  classes: "app-header",
  containerClasses: "govuk-width-container",
  serviceName: serviceName,
  serviceUrl: serviceUrl,
  useTudorCrown: true
}) }}
```

**After:**

```njk
{{ govukHeader({
  homepageUrl: "https://www.gov.uk/",
  classes: "app-header",
  containerClasses: "govuk-width-container",
  serviceName: serviceName,
  serviceUrl: serviceUrl
}) }}
```

### 5. Run `npm install`

After updating `package.json`, run `npm install` to resolve and install the new dependency tree.

## What is NOT changing

- The Webpack build config
- The nunjucks config for the host app's own routes (`src/config/nunjucks/nunjucks.js`)
- The SCSS (`_govuk-frontend.scss` already has the rebrand flag set)
- Tests (no test logic depends on the plugin version)
- Any other server routes or helpers

## Success Criteria

- `npm install` completes without unresolvable peer dependency errors
- `npm run dev` starts the server without runtime errors
- `/form/example-form/start` renders the start page with the King's Crown header (no Tudor Crown)
- `/form/example-form/full-name` and `/form/example-form/summary` render without errors
- No 500 errors from plugin-internal calls to `getFormMetadataById` during normal form navigation
