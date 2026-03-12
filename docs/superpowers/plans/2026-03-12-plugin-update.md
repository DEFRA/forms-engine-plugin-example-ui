# Plugin Update Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update `@defra/forms-engine-plugin` from v0.1.6 to v4.1.3, update `govuk-frontend` to v5.14.0, align the service interface and plugin registration with the v4 API, and enable the GOV.UK King's Crown rebrand.

**Architecture:** Four targeted file edits — `package.json` (deps), `forms-service.js` (new service methods), `server/index.js` (new plugin options), `layouts/page.njk` (rebrand). No new files needed. No structural changes.

**Tech Stack:** Hapi.js, `@defra/forms-engine-plugin` v4.1.3, `govuk-frontend` v5.14.0, Nunjucks, Jest

**Spec:** `docs/superpowers/specs/2026-03-12-plugin-update-design.md`

---

## Chunk 1: Dependencies, Service, Registration, and Layout

### Task 1: Update package.json and install

**Files:**

- Modify: `package.json`

- [ ] **Step 1: Update dependency versions in package.json**

  Change these four entries in the `"dependencies"` block:

  ```json
  "@defra/forms-engine-plugin": "^4.1.3",
  "@hapi/boom": "^10.0.1",
  "govuk-frontend": "^5.14.0",
  "hapi-pino": "^13.0.0",
  ```

  Note: `@hapi/boom` is a new addition (it was missing despite being imported in `forms-service.js`).

- [ ] **Step 2: Run npm install**

  ```bash
  npm install
  ```

  Expected: installs without unresolvable peer dependency errors. Warnings about optional peer deps are acceptable; hard errors are not.

- [ ] **Step 3: Commit**

  ```bash
  git add package.json package-lock.json
  git commit -m "chore: bump forms-engine-plugin to v4, govuk-frontend to v5.14"
  ```

---

### Task 2: Update forms-service.js — TDD

**Files:**

- Create: `src/server/forms-service.test.js`
- Modify: `src/server/forms-service.js`

- [ ] **Step 1: Write failing tests for the new and updated service methods**

  Create `src/server/forms-service.test.js`:

  ```js
  import Boom from '@hapi/boom'
  import services from '~/src/server/forms-service.js'

  const { formsService } = services

  const VALID_ID = '48158770-647d-4fde-a3c5-1fc1e28f780d'
  const VALID_SLUG = 'example-form'

  describe('formsService', () => {
    describe('getFormMetadata', () => {
      test('returns metadata for known slug', async () => {
        const result = await formsService.getFormMetadata(VALID_SLUG)
        expect(result.id).toBe(VALID_ID)
        expect(result.slug).toBe(VALID_SLUG)
      })

      test('throws Boom.notFound for unknown slug', async () => {
        await expect(formsService.getFormMetadata('unknown')).rejects.toThrow(
          Boom.notFound().message
        )
      })
    })

    describe('getFormMetadataById', () => {
      test('returns metadata for known id', async () => {
        const result = await formsService.getFormMetadataById(VALID_ID)
        expect(result.id).toBe(VALID_ID)
      })

      test('throws Boom.notFound for unknown id', async () => {
        await expect(
          formsService.getFormMetadataById(
            '00000000-0000-0000-0000-000000000000'
          )
        ).rejects.toThrow(Boom.notFound().message)
      })
    })

    describe('getFormDefinition', () => {
      test('returns definition for known id', async () => {
        const result = await formsService.getFormDefinition(VALID_ID)
        expect(result.engine).toBe('V2')
        expect(result.pages.length).toBeGreaterThan(0)
      })

      test('ignores state parameter and still returns definition', async () => {
        const result = await formsService.getFormDefinition(VALID_ID, 'live')
        expect(result.engine).toBe('V2')
      })

      test('throws Boom.notFound for unknown id', async () => {
        await expect(
          formsService.getFormDefinition('00000000-0000-0000-0000-000000000000')
        ).rejects.toThrow(Boom.notFound().message)
      })
    })

    describe('getFormSecret', () => {
      test('throws Boom.notFound always', async () => {
        await expect(
          formsService.getFormSecret(VALID_ID, 'some-secret')
        ).rejects.toThrow(Boom.notFound().message)
      })
    })
  })
  ```

- [ ] **Step 2: Run tests to confirm they fail**

  ```bash
  npx jest src/server/forms-service.test.js --no-coverage
  ```

  Expected: failures — `getFormMetadataById`, `getFormSecret` do not exist yet, and `getFormDefinition` will also fail on the `rejects` tests if it doesn't throw for unknown IDs (check current behaviour).

- [ ] **Step 3: Update forms-service.js**

  Open `src/server/forms-service.js`. Make these changes:

  1. **`getFormDefinition`** — add `_state` as ignored second parameter:

     ```js
     getFormDefinition: function (id, _state) {
     ```

  2. **Add `getFormMetadataById`** after `getFormMetadata`:

     ```js
     getFormMetadataById: function (id) {
       switch (id) {
         case metadata.id:
           return Promise.resolve(metadata)
         default:
           throw Boom.notFound(`Form '${id}' not found`)
       }
     },
     ```

  3. **Add `getFormSecret`** after `getFormDefinition`:

     ```js
     getFormSecret: function (formId, secretName) {
       throw Boom.notFound(
         `Secret '${secretName}' not found for form '${formId}'`
       )
     }
     ```

  The final `formsService` object should have these four methods: `getFormMetadata`, `getFormMetadataById`, `getFormDefinition`, `getFormSecret`. The `export default { formsService }` stays unchanged.

- [ ] **Step 4: Add JSDoc type annotation for `_state` and verify `getFormSecret` signature**

  After `npm install` has run (Task 1), check the exported types from the plugin:

  ```bash
  cat node_modules/@defra/forms-engine-plugin/package.json | grep -A5 '"./types"'
  ```

  Then inspect the `FormsService` interface:

  ```bash
  grep -A 10 'FormsService' node_modules/@defra/forms-engine-plugin/.server/server/plugins/engine/types/index.d.ts 2>/dev/null | head -40
  ```

  Use the confirmed import path to annotate `_state` in `forms-service.js`. If the type is exported as `FormStatus` from `@defra/forms-engine-plugin/types`, add at the bottom of the file's `@import` block:

  ```js
  /**
   * @import { FormStatus } from '@defra/forms-engine-plugin/types'
   */
  ```

  And annotate the parameter:

  ```js
  getFormDefinition: function (id, /** @type {FormStatus} */ _state) {
  ```

  Also confirm `getFormSecret`'s parameter order matches the interface (expected: `formId` first, `secretName` second). If the interface differs, update parameter names to match — the implementation (always throws) is unaffected.

  Run lint to confirm no type errors:

  ```bash
  npm run lint:types
  ```

  Expected: exits 0.

- [ ] **Step 5: Run tests to confirm they pass**

  ```bash
  npx jest src/server/forms-service.test.js --no-coverage
  ```

  Expected: all 8 tests PASS.

- [ ] **Step 6: Commit**

  ```bash
  git add src/server/forms-service.js src/server/forms-service.test.js
  git commit -m "feat: align formsService with v4 plugin interface"
  ```

---

### Task 3: Update plugin registration in server/index.js

**Files:**

- Modify: `src/server/index.js`

- [ ] **Step 1: Add `path` import to server/index.js**

  `path` is already imported on line 1 (`import path from 'path'`). No change needed — just confirm it's there.

- [ ] **Step 2: Replace the plugin registration block**

  Find this block (lines 69–71 in the current file):

  ```js
  // Register the forms-engine-plugin
  await server.register({ plugin, options: { services } })
  ```

  Replace with:

  ```js
  // Register the forms-engine-plugin
  await server.register({
    plugin,
    options: {
      baseUrl: `http://localhost:${config.get('port')}`,
      cache: config.get('session.cache.name'),
      nunjucks: {
        baseLayoutPath: 'layouts/page.njk',
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

  `@hapi/crumb` must be registered before the forms plugin — it already is (first `server.register([...])` batch on line 58). Do not reorder anything.

- [ ] **Step 3: Run the existing test suite to catch regressions**

  ```bash
  npx jest --no-coverage
  ```

  Expected: all existing tests pass. Any failures at this stage are regressions to investigate before proceeding.

- [ ] **Step 4: Commit**

  ```bash
  git add src/server/index.js
  git commit -m "feat: configure forms-engine-plugin v4 options"
  ```

---

### Task 4: Remove deprecated useTudorCrown from layout

**Files:**

- Modify: `src/server/common/templates/layouts/page.njk`

- [ ] **Step 1: Remove useTudorCrown from the govukHeader call**

  Open `src/server/common/templates/layouts/page.njk`. Find the `govukHeader` block (around line 16–23):

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

  Remove the `useTudorCrown: true` line:

  ```njk
  {{ govukHeader({
    homepageUrl: "https://www.gov.uk/",
    classes: "app-header",
    containerClasses: "govuk-width-container",
    serviceName: serviceName,
    serviceUrl: serviceUrl
  }) }}
  ```

  King's Crown is now the default in govuk-frontend v5.3+. The SCSS (`_govuk-frontend.scss`) already has `$govuk-new-organisation-colours: true`.

- [ ] **Step 2: Commit**

  ```bash
  git add src/server/common/templates/layouts/page.njk
  git commit -m "chore: remove deprecated useTudorCrown, King's Crown is now default"
  ```

---

### Task 5: Build and smoke-test

- [ ] **Step 1: Run the full test suite**

  ```bash
  npm test
  ```

  Expected: all tests pass.

- [ ] **Step 2: Build the frontend assets**

  ```bash
  npm run build:frontend
  ```

  Expected: Webpack compiles without errors. The SCSS import of `govuk-frontend` v5.14 should resolve correctly via `_govuk-frontend.scss`.

- [ ] **Step 3: Start the server in dev mode**

  ```bash
  npm run dev
  ```

  Expected: server starts on port 3000 with no errors in the console.

- [ ] **Step 4: Verify the form renders**

  In a browser (or via curl), visit:

  ```
  http://localhost:3000/form/example-form/start
  ```

  Expected:

  - Page renders with the GOV.UK King's Crown header (not Tudor Crown)
  - No 500 errors in the server console

  Then visit:

  ```
  http://localhost:3000/form/example-form/full-name
  http://localhost:3000/form/example-form/summary
  ```

  Expected: both pages render without errors.
