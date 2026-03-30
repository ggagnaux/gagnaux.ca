# Testing Design

## Goal

Add a pragmatic automated testing strategy to the site so core behavior can be verified consistently during development and before deployment.

The goal is not to introduce heavy testing infrastructure for its own sake. The goal is to create enough confidence around routing, authentication, content generation, database-backed behavior, and deployment-critical scripts that changes can be made safely.

## Product Direction

### Core principle

- Keep the test stack lightweight.
- Prioritize high-value coverage over broad but shallow coverage.
- Start with stable server-side and service-level behavior.
- Add browser-level testing only after the core test foundation is working well.

### Why this fits the current app

The current codebase already has:

- a clean Express app entry in `src/app.js`
- server-rendered routes
- SQLite-backed persistence
- service modules with business logic separated from route handlers
- build and deploy scripts that can be validated without a browser

That makes the project a good fit for a small, maintainable testing layer built around Node-native tooling and targeted integration tests.

## Scope

### In scope

- Add a test runner and test scripts
- Support isolated test databases
- Add HTTP integration tests for public and admin routes
- Add unit or service tests for logic-heavy modules
- Add script-level tests for build and deploy behavior
- Add reusable test fixtures and helpers

### Out of scope for the first phase

- Full browser automation
- Visual regression testing
- Snapshot-heavy template testing
- Performance benchmarking
- Large end-to-end suites with external services

## Recommended Stack

### Test runner

Use Node's built-in `node:test` runner.

Why:

- no large framework dependency required
- good fit for a CommonJS Express app
- simple CI and local execution model
- easier to keep lightweight than Jest or similar tools for this project

### HTTP testing

Use `supertest` for request-level integration tests.

Why:

- works cleanly with the exported Express app
- avoids starting a real network listener in tests
- ideal for route, session, and response assertions

### Assertions and mocks

Use the built-in `assert` module first.
Only add deeper mocking utilities if they become clearly necessary.

## Architecture

### Test layers

#### Layer 1: Request and route integration tests

These tests exercise the app through HTTP requests against the Express instance.

Primary targets:

- homepage
- public routes with expected `200` responses
- `404` behavior
- admin authentication redirects or guards
- admin login success and failure paths
- post and project routes that render public content

This layer should provide the earliest confidence because it tests the app close to how it is actually used.

#### Layer 2: Service and utility tests

These tests target logic-heavy modules directly.

Recommended early targets:

- `src/services/distributionService.js`
- `src/services/linkedinAuthService.js`
- `src/services/postService.js`
- `src/services/projectService.js`
- `src/utils/content.js`
- `src/utils/formatters.js`

This layer should focus on deterministic transformations, payload generation, parsing, validation, and formatting.

#### Layer 3: Build and deploy script tests

These tests validate file-system and deployment behavior.

Recommended targets:

- `scripts/build.js`
- `scripts/deploy.js`

Important behaviors to test:

- build output is generated successfully
- client-side JavaScript minification runs by default
- `--skip-minify-js` disables minification
- deploy defaults to the local `deploy/` folder when no target is provided
- deploy copies and transforms `.env` correctly

## Test database strategy

### Requirement

Tests must not touch the developer's main local SQLite database.

### Recommended approach

Refactor database initialization so tests can provide a separate database path through environment configuration, such as `DATABASE_PATH`.

The database layer should also expose enough control to:

- initialize schema for tests
- reset state between tests
- close connections cleanly after tests finish

### Why this matters

Without test database isolation:

- tests become flaky
- local data can be corrupted or polluted
- parallel test execution becomes risky
- repeatable setup is much harder

## Fixtures and helpers

### Recommended test support structure

Create a `tests/` folder with small reusable helpers such as:

- test app bootstrap helper
- temporary database helper
- seeded user helper
- authenticated admin agent helper
- file-system temp directory helper for build and deploy tests

This should keep individual tests focused on behavior rather than repetitive setup.

## Phase plan

## Phase 1: Foundation

Add the test runner, HTTP testing library, scripts, and isolated database support.

Capabilities:

- run tests with one command
- spin up isolated app instances for tests
- create temporary test databases
- add first request-level smoke tests

This phase creates the base that all later test work depends on.

## Phase 2: Core route coverage

Add integration coverage for public and admin request flows.

Capabilities:

- verify key public pages
- verify `404` rendering
- verify admin access control
- verify login behavior
- verify basic CRUD-adjacent request flows where stable and valuable

## Phase 3: Service coverage

Add unit and service tests around business logic and transformations.

Capabilities:

- distribution payload generation checks
- canonical URL generation checks
- auth helper validation
- content parsing and formatting checks

## Phase 4: Script coverage

Add tests for build and deploy scripts.

Capabilities:

- verify build output
- verify JS minification behavior
- verify deploy target defaults
- verify `.env` transform logic

## Phase 5: Optional browser smoke tests

Only after the first four phases are healthy.

Capabilities:

- verify critical pages render in a browser
- verify admin login flow in a real browser
- verify a few high-value UI regressions

## Risks and tradeoffs

### Risk: Overbuilding the test stack

A heavy framework or too many helpers too early would create maintenance cost that outweighs the initial value.

Response:

- keep the first stack minimal
- only add tooling when a real need emerges

### Risk: Tests tightly coupled to seed content

If tests depend too much on seeded production-like data, they will become brittle.

Response:

- use explicit fixtures where possible
- keep assertions focused on stable behaviors rather than incidental content

### Risk: Database singleton behavior makes tests hard to isolate

The current database module is singleton-oriented.

Response:

- refactor database access just enough to support a test DB path and controlled lifecycle
- avoid broad architectural churn unless needed

### Risk: Browser tests too early

Browser automation is valuable, but it is slower and heavier than request and service tests.

Response:

- defer browser testing until the lower layers are already providing solid value

## Success criteria

The testing effort should be considered successful when:

- `npm test` runs reliably on a fresh clone after install
- tests do not use the main local SQLite database
- key public and admin flows have coverage
- logic-heavy service modules have deterministic tests
- build and deploy script behavior is covered for the most failure-prone paths
- new features can follow an established pattern for adding tests

## Initial recommendation

Start with the smallest useful vertical slice:

- add the Node test harness
- add `supertest`
- isolate the database for tests
- write 4 to 6 request-level tests
- then expand into service and script coverage

That path creates real confidence quickly while keeping the maintenance burden reasonable.
