# Social Publishing Tasks

## Objective

Implement a phased social publishing and external distribution system for blog posts while keeping the website post as the canonical source of truth.

## Current status

- [x] Phase 1 foundation is implemented in the app
- [x] Distribution settings tab added to admin settings
- [x] Distribution tab added to the post editor
- [x] Share-kit content generation wired to the post lifecycle
- [x] Manual share actions and basic UI polish added to the Distribution flow
- [x] Product direction is now refocused on LinkedIn, Medium, and Substack for the next implementation phase
- [x] Mark-published validation now checks that the distribution belongs to the current post
- [x] LinkedIn auth/config scaffolding is now in place with connect, callback, disconnect, and server-side token storage
- [ ] End-to-end browser testing still needed
- [x] Active destination refactor now exposes LinkedIn, Medium, and Substack in the app

## Phase 1: Foundation

- [x] Create database tables for destination configuration and per-post distribution state
- [x] Update `db/schema.sql` with initial distribution tables
- [x] Add schema guard or migration-style checks in `src/config/database.js`
- [x] Define status values for distribution records
- [x] Decide whether destination configuration lives in `settings` or a dedicated table
- [x] Add service module scaffolding for distribution logic

## Phase 1: Domain model

- [x] Create `distributionService`
- [x] Create destination formatter helpers
- [x] Add helpers to build canonical public post URLs
- [x] Add helpers to derive lead image, tags, and excerpt-driven share content
- [x] Define a normalized payload structure for destination content previews

## Phase 1: Admin settings

- [x] Add admin configuration UI for enabled destinations
- [x] Add fields for destination label, type, enabled state, and posting mode
- [x] Add support for webhook destination configuration
- [x] Add storage for server-side destination config
- [ ] Ensure secrets are never rendered into client-side HTML

## Phase 1: Post editor

- [x] Add a `Distribution` tab to the admin post form
- [x] Show configured destinations for the current post
- [x] Show generated copy variants for each destination
- [x] Add manual actions such as `Copy`, `Open Destination`, and `Mark Published`
- [x] Add manual copy actions for the short announcement and newsletter summary variants
- [x] Show last status, last attempted time, published time, and errors
- [x] Ensure the tab works for both new and existing posts

## Phase 1: Publish lifecycle

- [x] Hook distribution refresh into post creation
- [x] Hook distribution refresh into post update
- [x] Refresh distribution records when a post becomes published
- [ ] Decide how updates to already published posts should affect existing distribution records
- [x] Validate mark-published actions against the current post/distribution pair
- [x] Ensure local post publish succeeds even if distribution generation fails
- [x] Add flash messaging or inline admin feedback for distribution outcomes

## Phase 1: Manual workflow

- [x] Add copy-ready short announcement text
- [x] Add copy-ready long announcement text
- [x] Add newsletter summary text
- [x] Add canonical link output
- [x] Add tag or hashtag suggestions
- [x] Add image reference or lead image preview where useful

## Phase 1: Post list visibility

- [x] Add distribution status summary to the posts table
- [x] Show whether a post has destinations configured
- [x] Show whether distributions are ready, published, or failed

## Phase 1: Verification

- [x] Run code-level verification on the new JS files
- [x] Initialize the database and verify the new schema loads
- [ ] Verify Distribution settings tab layout and controls in the browser
- [ ] Test creating a draft post without destinations
- [ ] Test publishing a post with one enabled destination
- [ ] Test publishing a post with multiple enabled destinations
- [ ] Test editing a published post and refreshing distribution content
- [ ] Test failure handling and admin error visibility
- [ ] Test manual mark-published flow

## Phase 2: LinkedIn, Medium, and Substack refactor

- [x] Replace the current active destination set with LinkedIn, Medium, and Substack
- [x] Remove or hide Bluesky, Mastodon, Newsletter, and Webhook from the active admin workflow
- [x] Add destination-specific payload builders for LinkedIn, Medium, and Substack
- [x] Add article-ready body formatting for Medium
- [x] Add newsletter/article-ready body formatting for Substack
- [x] Add platform-specific preview sections in the post editor
- [x] Add platform-specific settings fields where needed
- [x] Add validation hints for missing excerpt, missing canonical URL, and missing lead image
- [x] Verify that existing posts regenerate distribution records cleanly after the refactor

## Phase 2: LinkedIn auth and publish readiness

- [x] Add server-side LinkedIn OAuth config using environment variables
- [x] Add LinkedIn connect and callback routes in admin settings
- [x] Store LinkedIn access-token connection data on the server
- [x] Show LinkedIn connection status in the Distribution settings tab
- [ ] Verify the full LinkedIn OAuth callback flow in the browser
- [ ] Add actual LinkedIn post publishing using the connected author URN and access token

## Phase 2: Manual publishing workflow

- [ ] Keep LinkedIn as announcement-style manual distribution
- [ ] Add export-ready copy for Medium
- [ ] Add export-ready copy for Substack
- [ ] Show exactly what content should be copied into each platform
- [ ] Decide whether Medium and Substack should use full body or lightly adapted body by default

## Phase 2: Deferred automation

- [ ] Decide when webhook delivery returns to scope
- [ ] Decide when native publishing auth flows return to scope
- [ ] Decide whether LinkedIn native publishing is worth the added maintenance cost

## Phase 2: Delivery logging

- [ ] Add optional `distribution_attempts` table
- [ ] Record each send attempt with timestamp and outcome
- [ ] Store sanitized request and response metadata
- [ ] Surface recent attempts in the admin UI

## Phase 3: Native integrations and automation

- [ ] Choose the first native platform integration among LinkedIn, Medium, and Substack
- [ ] Add platform-specific auth/config storage
- [ ] Implement destination adapter for publish
- [ ] Store external post ID and external URL
- [ ] Add retry and republish behavior rules
- [ ] Add update behavior for already published external posts

## Product decisions to resolve

- [x] Decide the initial destination list for launch
- [x] Decide whether manual posting is the default for all destinations
- [x] Decide that the current implementation phase focuses on LinkedIn, Medium, and Substack
- [ ] Decide whether first launch is strictly manual/share-kit only for these three platforms
- [ ] Decide how much body transformation Medium should get by default
- [ ] Decide how much body transformation Substack should get by default
- [ ] Decide which of the three should be the first native integration

## Nice-to-have follow-ups

- [ ] Add scheduled distribution
- [ ] Add destination-specific character counting
- [ ] Add richer hashtag mapping
- [ ] Add image cropping or per-destination media selection
- [ ] Add analytics or engagement tracking
- [ ] Add duplicate-content safeguards for repeated publish actions
