---
name: testing-and-validation
description: How to run, read, and write tests in this repo (Vitest + React Testing Library, 269 tests), plus the validation checklist to run before declaring any task done. Load when writing or fixing tests, when a test fails, when asked "run the tests", or before finishing any code change.
---

# Testing and Validation

## Stack and config

- Test runner: Vitest 3 with React Testing Library (`@testing-library/react` + `@testing-library/jest-dom`).
- Config: `vitest.config.mjs`. Key settings — do NOT remove any of them:
  - `environment: 'jsdom'` and `globals: true` (tests use `describe`/`it` without imports, but most files import them from `vitest` anyway).
  - `esbuild: { jsx: 'automatic' }` — REQUIRED. Without it, page tests fail with "React is not defined" because the app's `.jsx` files never import React.
  - `setupFiles: ['./test/setup.js']` — loads `@testing-library/jest-dom/vitest` matchers (`toBeInTheDocument` etc.).
  - `include: ['test/**/*.test.{js,jsx}']` — new test files MUST live under `test/` and match this glob or they silently never run.
  - Alias `@` → repo root.

## Running tests

```bash
npm test                                  # full suite (vitest run), must be fully green
npx vitest run test/combat/combatPage.test.jsx   # one file
npm run test:watch                        # watch mode (interactive only)
```

## Philosophy: characterization tests

Much of the suite pins CURRENT behavior, including known quirks — grep `QUIRK` in `test/api/` (e.g. `test/api/dmRoute.test.js` pins that the migration merge is shallow and that deleting a nonexistent id still returns success). Rules:

- If a test fails after your change, the default assumption is your change is a regression — not that the test is wrong.
- Changing pinned behavior is only legitimate if you flip the pinned test DELIBERATELY in the same change, with a comment explaining why the behavior changed.
- Known quirks worth fixing later belong in `SUGGESTIONS.md` at the repo root, not in silent test edits.

## API route test pattern

Copy the structure from `test/api/userDataRoutes.test.js`. Essentials:

1. First line of the file: `// @vitest-environment node` — route tests run in node, not jsdom.
2. Routes resolve their data directory from `process.cwd()` **at module import time**. So in `beforeAll`:

```js
tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dm-app-route-test-'));
dataDir = path.join(tmpDir, 'data');
cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpDir);
```

   and only AFTER that, dynamically import the route:

```js
route = await import('../../app/api/party/route.js');
```

3. `beforeEach`: `fs.rmSync(dataDir, { recursive: true, force: true }); fs.mkdirSync(dataDir, { recursive: true });` so every test starts empty.
4. `afterAll`: restore the spy and `fs.rmSync(tmpDir, ...)`.
5. Build POST requests with the standard `Request` constructor:

```js
new Request('http://localhost/api/test', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});
```

6. Module-level caches: `app/api/templates/route.js` caches conflux data in a module variable `confluxCache`. Tests that need a fresh cache use `vi.resetModules()` + a fresh dynamic `import(...)` — see the `freshRoute()` helper in `test/api/templatesRoute.test.js`.

See the api-route-conventions skill for how the routes themselves are structured.

## Page (component) test pattern

Copy the structure from `test/combat/combatPage.test.jsx`. Essentials:

- Mock `next/link` AND `next/navigation` at the top, BEFORE importing the page. The `next/navigation` mock MUST include `usePathname` — the shared Navbar calls it and the render crashes otherwise:

```jsx
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }) => <a href={href} {...props}>{children}</a>,
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/combat',
}));
```

- Mock `global.fetch` with a `vi.fn` that routes by URL and returns `{ ok: true, json: async () => data }`; non-GET calls return a generic `{ success: true }` unless the test overrides.
- `vi.useFakeTimers()` in `beforeEach`; `vi.useRealTimers()` + `vi.restoreAllMocks()` in `afterEach`.
- Flush mocked-fetch microtasks with `const flush = () => act(async () => {});`.
- Auto-save gating: the combat (`app/combat/page.jsx`) and characters (`app/characters/page.jsx`) pages enable saving via a 500ms `saveEnabled` timer after load, then debounce each save by 1000ms. To settle after initial render, advance ~1600ms inside `act`:

```js
const settle = async () => {
  await flush();
  await act(async () => { vi.advanceTimersByTime(1600); });
  await flush();
};
```

  After a user edit (save already enabled), advancing ~1100ms is enough to fire the debounced POST (see `test/characters/charactersPage.test.jsx`).
- Use `fireEvent`, NOT `userEvent` — userEvent conflicts with fake timers.
- Assert save behavior through the fetch mock's POST calls (URL + parsed JSON body). This is the strongest guard: echo-save regressions (page POSTing loaded data straight back) were caught exactly this way, e.g. the "does not echo loaded data back to the API after load" tests asserting `postCalls(fetchMock, '/api/party')` has length 0.

## jsdom trap: named form access

`form.npcName` works in real browsers but is NOT implemented in jsdom. Page submit handlers rely on it, so tests shim it before submitting (see `test/characters/charactersPage.test.jsx`):

```js
const form = container.querySelector('form');
for (const el of form.elements) {
  if (el.name) form[el.name] = el;
}
```

Do this in any test that submits a form whose handler reads fields by name.

## Traps / Do NOT

- Do NOT touch the repo's real `data/` directory from tests. Always mkdtemp + mock `process.cwd()`. A test that writes to real `data/` corrupts the user's campaign state.
- Do NOT import an API route module before mocking `process.cwd()` — the data path is resolved at import time and the mock will be ignored.
- Do NOT forget `// @vitest-environment node` on API route tests; jsdom's environment breaks node fs/Request behavior in subtle ways.
- Do NOT use `userEvent` in page tests — fake timers hang it. Use `fireEvent`.
- Do NOT omit `usePathname` from the `next/navigation` mock — Navbar renders on every page and calls it.
- Do NOT remove `esbuild: { jsx: 'automatic' }` from `vitest.config.mjs` — page tests fail with "React is not defined".
- Do NOT put test files outside `test/**/*.test.{js,jsx}` — they will not be picked up.
- Do NOT "fix" a failing QUIRK/characterization test by editing its expectation without an explanatory comment and a deliberate reason in the same change.
- Do NOT rely on real time; every page test uses fake timers, so all waits are `vi.advanceTimersByTime` inside `act`.

## Validation checklist (before declaring any task done)

1. `npx vitest run` — fully green (18 files / 269 tests at last count; the count only goes up).
2. `npm run build` — Next.js production build succeeds.
3. If you changed page behavior: the relevant page test asserts the NEW behavior, ideally via fetch-mock POST counts and bodies (the strongest regression guard in this suite).
4. If you deferred a cleanup or found a quirk: record it in `SUGGESTIONS.md`.

Related skills: dm-app-map (where things live), api-route-conventions (route structure the API tests pin), frontend-patterns (the auto-save/debounce pattern the page tests exercise), rules-math (pure-function modules with their own unit tests), debugging-playbook (when a test fails and you don't know why).
