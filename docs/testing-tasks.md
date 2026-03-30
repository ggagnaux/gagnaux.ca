# Testing Tasks

## Objective

Implement a lightweight, maintainable automated testing foundation for the application, then expand coverage in phases around the most important routes, services, and build or deploy workflows.

## Current status

- [ ] No test runner is configured yet
- [ ] No `tests/` directory exists yet
- [ ] No isolated test database path is configured yet
- [ ] No HTTP integration tests exist yet
- [ ] No service-level tests exist yet
- [ ] No build or deploy script tests exist yet

## Phase 1: Test foundation

- [ ] Add a test runner using Node's built-in `node:test`
- [ ] Add `supertest` as a dev dependency
- [ ] Add `npm test` script to `package.json`
- [ ] Add a watch or targeted test script if useful
- [ ] Create a top-level `tests/` directory
- [ ] Add shared test helpers for app bootstrapping and cleanup

## Phase 1: Test database isolation

- [ ] Refactor `src/config/database.js` so tests can supply a separate database path
- [ ] Add support for a test database environment variable such as `DATABASE_PATH`
- [ ] Add a way to initialize schema for tests without touching the local main database
- [ ] Add a way to reset or recreate the database between tests
- [ ] Add a way to close database connections after test runs
- [ ] Verify tests never touch `db/site.sqlite`

## Phase 1: First request tests

- [ ] Add a test for `GET /` returning `200`
- [ ] Add a test for unknown public routes returning `404`
- [ ] Add a test for `/admin` redirecting or blocking when unauthenticated
- [ ] Add a test for successful admin login with seeded or fixture credentials
- [ ] Add a test for failed admin login with invalid credentials
- [ ] Add a test that a logged-in admin can reach a protected page

## Phase 1: Verification

- [ ] Run the full test suite locally
- [ ] Confirm the suite passes on a fresh temporary database
- [ ] Confirm sessions, cookies, and redirects are behaving as expected in tests
- [ ] Confirm no test relies on local developer state

## Phase 2: Public route coverage

- [ ] Add tests for `/projects`
- [ ] Add tests for `/blog`
- [ ] Add tests for `/about`
- [ ] Add tests for `/contact`
- [ ] Add tests for published project detail pages
- [ ] Add tests for published blog detail pages
- [ ] Add tests for expected missing-content behavior on invalid slugs

## Phase 2: Admin route coverage

- [ ] Add tests for admin dashboard rendering
- [ ] Add tests for admin post list rendering
- [ ] Add tests for admin project list rendering
- [ ] Add tests for admin settings rendering
- [ ] Add tests for admin logout behavior
- [ ] Add tests for CSRF-adjacent or form submission behavior if applicable

## Phase 3: Service and utility tests

- [ ] Add tests for `src/services/distributionService.js`
- [ ] Add tests for canonical URL generation
- [ ] Add tests for hashtag and excerpt-derived output
- [ ] Add tests for destination payload generation
- [ ] Add tests for `src/services/linkedinAuthService.js`
- [ ] Add tests for `src/services/postService.js`
- [ ] Add tests for `src/services/projectService.js`
- [ ] Add tests for `src/utils/content.js`
- [ ] Add tests for `src/utils/formatters.js`

## Phase 3: Edge cases

- [ ] Verify service behavior with missing or partial settings
- [ ] Verify service behavior with empty tags, excerpts, and media
- [ ] Verify formatting logic with unusual punctuation or spacing
- [ ] Verify auth helper behavior when env values are missing

## Phase 4: Build and deploy script tests

- [ ] Add tests for `scripts/build.js`
- [ ] Verify build output is created in `build/`
- [ ] Verify client-side JS is minified by default during build
- [ ] Verify `--skip-minify-js` disables minification
- [ ] Add tests for `scripts/deploy.js`
- [ ] Verify deploy defaults to the local `deploy/` folder when `--target` is omitted
- [ ] Verify deploy copies `.env` into the target
- [ ] Verify deploy comments out the marked development block in `.env`
- [ ] Verify deploy uncomments the marked production block in `.env`
- [ ] Verify deploy fails clearly if required environment markers are missing

## Phase 4: File-system safety

- [ ] Ensure build and deploy tests run only in temporary directories
- [ ] Ensure script tests clean up after themselves
- [ ] Ensure script tests do not overwrite a real local `deploy/` directory unintentionally

## Phase 5: Optional browser smoke tests

- [ ] Decide whether browser testing is worth the maintenance cost for this project
- [ ] If yes, choose a tool such as Playwright
- [ ] Add one smoke test for homepage render
- [ ] Add one smoke test for admin login flow
- [ ] Add one smoke test for a public detail page render

## Maintenance tasks

- [ ] Document the testing workflow in project docs or README material
- [ ] Add guidance for creating fixtures and helpers
- [ ] Add guidance for choosing between request tests and service tests
- [ ] Establish a convention for naming and organizing test files
- [ ] Add a lightweight policy that new logic-heavy features should include tests where practical

## Suggested implementation order

- [ ] Set up the test runner and test scripts
- [ ] Isolate the database for tests
- [ ] Add the first request-level tests
- [ ] Add service tests for the highest-value logic modules
- [ ] Add build and deploy script tests
- [ ] Reassess whether browser smoke tests are still needed

## Definition of done

- [ ] `npm test` runs successfully
- [ ] Tests are isolated from the main local database
- [ ] Key public and admin flows are covered
- [ ] Core service logic has deterministic coverage
- [ ] Build and deploy behaviors have targeted automated verification
- [ ] The project has a clear pattern for adding tests going forward
