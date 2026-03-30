# Social Publishing Design

## Goal

Extend the site's existing blog workflow so a post on `gagnaux.ca` can also be prepared for distribution to one or more external platforms without making those platforms the source of truth.

The website remains the canonical home for each post. External publishing is treated as a distribution layer attached to an existing post.

## Product Direction

### Core principle

- Author once in the site admin.
- Publish first to the website.
- Distribute outward from the website post.

### Why this fits the current app

The current codebase already has:

- a canonical `posts` table
- a clean admin post editor
- a `draft` / `published` lifecycle
- lightweight SQLite-backed persistence
- server-rendered admin views

That makes external publishing a natural extension of the existing post lifecycle rather than a separate authoring system.

## Scope

### In scope

- Configure one or more distribution destinations
- Generate destination-specific payloads from a post
- Track delivery status per post and destination
- Support manual distribution first
- Leave room for automation and native API publishing later

### Out of scope for the first phase

- Full OAuth flows for several platforms at once
- Rich bidirectional sync from third-party platforms back into the site
- Treating external platforms as editable primary content sources
- Cross-platform analytics dashboards

## Terms

### Destination

A publishing target such as LinkedIn, Medium, Substack, newsletter, webhook, or a future platform added in a later phase.

### Distribution record

A record that ties one local post to one destination and tracks its publishing state, payload, and any external identifiers.

### Share kit

A generated set of destination-specific content variants such as:

- short social announcement
- longer professional summary
- newsletter blurb
- title, link, excerpt, tags, and image choices

## Recommended Rollout

## Phase 1: Share kit + status tracking

Build the distribution layer without committing to direct API publishing yet.

Capabilities:

- create distribution records for selected destinations
- generate destination-specific copy from the site post
- display copy in the admin
- support manual copy/paste and link-out workflows
- optionally send content to a generic webhook
- track `draft`, `ready`, `published`, and `failed`

This delivers immediate value with low implementation and maintenance risk.

## Phase 2: Focused long-form distribution

Narrow the next implementation phase to three platforms only:

- LinkedIn
- Medium
- Substack

This phase should prioritize strong platform-specific preparation and admin workflow over broad platform coverage.

Recommended direction:

- `LinkedIn` gets announcement-style distribution with title, summary, tags, and canonical link
- `Medium` gets a full or near-full article payload formatted from the canonical blog post
- `Substack` gets a newsletter/article variant with subject, intro, body, and canonical attribution

All other social destinations should be treated as future work for now.

## Phase 3: Automation and native publishing

After the three-platform workflow is solid, add automation and native delivery only where it is worth the maintenance cost.

Likely order:

- LinkedIn announcement workflow
- Medium export or native publishing
- Substack export or native publishing
- Other platforms later

## Architecture

### Source of truth

The existing `posts` table remains canonical.

External content should be derived from:

- `title`
- `slug`
- `excerpt`
- `body_markdown` or `body_html`
- `tags`
- post images
- canonical public URL

### New data model

Recommended new tables:

#### `distribution_destinations`

Stores the configured destination definitions.

Suggested fields:

- `id`
- `key` such as `linkedin`, `medium`, `substack`, `newsletter`, `webhook`
- `label`
- `destination_type`
- `is_enabled`
- `posting_mode` such as `manual`, `on_first_publish`, `on_every_update`
- `config_json`
- `created_at`
- `updated_at`

#### `post_distributions`

Stores the status of a specific post for a specific destination.

Suggested fields:

- `id`
- `post_id`
- `destination_id`
- `status` such as `draft`, `ready`, `queued`, `published`, `failed`, `skipped`
- `payload_json`
- `share_text`
- `external_post_id`
- `external_url`
- `last_attempted_at`
- `published_at`
- `error_message`
- `created_at`
- `updated_at`

#### Optional later: `distribution_attempts`

Useful if we want a durable delivery log.

Suggested fields:

- `id`
- `post_distribution_id`
- `attempt_type`
- `request_payload`
- `response_payload`
- `status`
- `error_message`
- `created_at`

## Content generation model

Each destination should be able to derive a payload from one canonical post and a destination formatter.

### Formatter inputs

- post title
- excerpt
- body markdown
- body html
- tags
- selected lead image
- canonical URL
- site title or author metadata

### Formatter outputs

- short announcement copy
- long announcement copy
- destination-specific title
- list of tags or hashtags
- external article body if needed
- media selection

### Recommended destination formats

- `announcement_short`
- `announcement_long`
- `newsletter_summary`
- `link_post`
- `article_body`
- `newsletter_body`

### Phase 2 platform mapping

- `LinkedIn`: announcement copy with optional tags and canonical link
- `Medium`: article title, formatted article body, excerpt, tags, and canonical attribution
- `Substack`: subject line, intro blurb, formatted article body, and newsletter-oriented summary

## Admin experience

### Post editor

Add a `Distribution` tab to the existing post editor.

Suggested sections:

- destination list with enabled state and status
- platform-specific generated content preview
- manual actions such as `Copy`, `Mark Published`, `Open Destination`
- export-ready content for Medium and Substack
- error and last-attempt information

### Post list

Add a compact distribution summary per post.

Examples:

- `2 ready`
- `1 published / 1 failed`
- `No destinations`

### Settings

Add distribution configuration to admin settings or a separate admin area.

Suggested settings concerns:

- enabled destinations
- destination URLs
- API keys or tokens
- default posting mode
- default hashtags or tag mapping rules
- canonical site URL if not already centrally configured

For the current phase, the visible destination set should be focused on:

- LinkedIn
- Medium
- Substack

## Publish workflow

### Recommended lifecycle

1. Author a post as draft.
2. Change status to published.
3. Persist the website post first.
4. Create or refresh distribution records.
5. Generate destination-specific payloads.
6. Depending on destination mode:
7. Leave ready for manual posting, or queue/send automatically.
8. Save results and surface them in the admin.

### Important rule

Website publish must not fail just because an external destination fails.

The local post save should remain independent. Distribution errors should be recorded and surfaced, but they should not block the canonical site publish.

## Initial platform strategy

### Recommended first targets

- generic webhook
- LinkedIn-style copy
- Bluesky or Mastodon-style copy
- newsletter summary

### Why these first

- broad usefulness
- lower API complexity
- high value even with manual posting
- keeps the first implementation grounded and maintainable

## Operational concerns

### Security

- store tokens and secrets carefully
- avoid exposing secrets in templates or client-side code
- keep destination config server-side
- redact sensitive error payloads before surfacing them in the admin

### Reliability

- external failures should not roll back local post publishing
- retries should be explicit and traceable
- status values should clearly distinguish `ready`, `queued`, `published`, and `failed`

### Idempotency

- avoid duplicate publishing when saving a post multiple times
- distinguish first publish from later updates
- store external IDs where available

### Content integrity

- preserve the site URL as the canonical link
- make per-destination content transformations explicit
- avoid destructive rewriting of the source post

## Integration notes for this codebase

### Service layer

Add a distribution service layer parallel to the existing post service:

- `distributionService`
- optional destination-specific formatter modules
- optional delivery adapters per destination

### Controllers

Extend admin post save/update handling so distribution records can be created or refreshed after the canonical post is saved.

### Views

Extend the server-rendered post admin form with a new tab and summary components rather than introducing a new frontend application.

### Database strategy

Follow the existing pattern:

- add tables to `db/schema.sql`
- add lightweight schema guards in `src/config/database.js` if needed

## Open design questions

- Should manual distribution be the default for all destinations in phase 1?
- Should updates to an already published post regenerate destination payloads automatically?
- Which platforms matter most for the first real integration?
- Do we want long-form cross-posting, short-form announcement posting, or both?
- Should newsletter generation live in the same system or be deferred?

## Recommendation

Build phase 1 around a share kit, destination configuration, and per-post distribution tracking. That gives the site a strong distribution foundation now, while preserving room for webhook automation and native API integrations later.
