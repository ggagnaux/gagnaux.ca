# Project Status Checklist

Legend:
- `[x]` Implemented
- `[-]` Partially implemented
- `[ ]` Not implemented

This checklist compares the current codebase against the feature expectations in `design.md`.

## Core Stack and Architecture

- [x] Node.js application scaffolded
- [x] Express server configured
- [x] SQLite database configured
- [x] Server-rendered templating implemented
- [x] Public/admin route separation implemented
- [x] Controllers, services, middleware, views, and public assets directories present
- [ ] API route layer implemented
- [ ] Model layer implemented as a separate abstraction


## Code Improvements
- [ ] Replace 'Magic Numbers' in with constants


## Public Information Architecture

- [x] Home page (`/`)
- [x] Projects index (`/projects`)
- [x] Project detail pages (`/projects/:slug`)
- [x] Blog index (`/blog`)
- [x] Blog detail pages (`/blog/:slug`)
- [x] About page (`/about`)
- [x] Contact page (`/contact`)
- [ ] Optional future pages (`/notes`, `/experiments`, `/uses`, `/now`)

## Homepage

- [x] Header with brand and primary navigation
- [x] Hero section with eyebrow, headline, body copy, CTA buttons, and trust line
- [x] Hero visual motif on the right side
- [x] Featured Projects section
- [x] What I Do section
- [x] Writing & Notes section
- [x] Elsewhere section
- [x] Footer section
- [x] Placeholder homepage content seeded from the design document
- [ ] Discreet public admin access shown only when authenticated
- [x] Optional animated logo at top left corner + admin tool to manage

## Visual Design System

- [x] Dark “Signal Lab” visual direction established
- [x] Themeable design token system implemented
- [x] Button styles implemented
- [x] Card styles implemented
- [x] Responsive layout behavior implemented
- [x] Theme selector implemented
- [-] Motion system aligned with the design brief
- [-] Final visual polish pass complete across all pages

## Blog

- [x] Posts table created
- [x] Blog index page implemented
- [x] Blog detail page implemented
- [x] Post metadata structure includes title, slug, excerpt, body, status, featured flag, timestamps
- [x] Tags supported
- [x] Draft and published states supported
- [x] Featured blog content shown on the homepage
- [x] Markdown stored and rendered to HTML
- [ ] Featured image support wired through to the public blog UI
- [ ] Reading time support
- [ ] Related posts / more posts section
- [ ] Sanitized Markdown HTML output

## Projects

- [x] Projects table created
- [x] Projects index implemented
- [x] Project detail pages implemented
- [x] Featured project selection connected to homepage
- [x] External and internal project links supported
- [x] Project ordering / priority supported
- [ ] Thumbnail image support wired through to the public projects UI
- [ ] Cover image support wired through to the public projects UI
- [ ] Support multiple project images for use in a carousel on homepage.


## Admin Area

- [x] Admin login page
- [x] Admin dashboard
- [x] Admin posts index
- [x] Admin create post flow
- [x] Admin edit post flow
- [x] Admin delete post flow
- [x] Admin projects index
- [x] Admin create project flow
- [x] Admin edit project flow
- [x] Admin delete project flow
- [x] Admin settings page
- [x] Admin media page
- [x] Admin logout flow
- [x] Public Site link from admin
- [ ] Admin logo and branding asset management
- [ ] Homepage section visibility toggles
- [ ] Post filtering by draft/published
- [ ] Post preview workflow
- [ ] Media selection UI for posts/projects/logo
- [ ] Delete unused image detection

## Admin Dashboard Expectations

- [x] Recent posts shown
- [x] Draft count shown
- [x] Published post count shown
- [x] Project count shown
- [x] Quick link to create a post
- [ ] Quick link to create a project
- [ ] Logo preview shown

## Admin Settings Expectations

- [x] Site title editable
- [x] Site descriptor editable
- [x] Hero headline editable
- [x] Hero supporting text editable
- [x] Hero CTA labels editable
- [x] Hero CTA links editable
- [x] Footer text editable
- [x] External profile links editable
- [x] About page text editable
- [x] Contact page text editable
- [ ] Static logo image editable
- [ ] Section visibility toggles editable

## Media Management

- [x] File upload support implemented
- [x] Uploaded media listing implemented
- [x] Media delete action implemented
- [x] Alt text field stored for uploaded files
- [ ] File type validation for uploads
- [ ] Image size / dimension processing
- [ ] Image optimization pipeline
- [ ] Media picker integration into posts/projects/settings

## Authentication and Security

- [x] Single-admin login model implemented
- [x] Password hashing with bcrypt
- [x] Session-based authentication
- [x] Protected admin routes
- [ ] Session persistence stored in SQLite or another production-ready store
- [ ] CSRF protection
- [-] Strong admin bootstrap / credential rotation flow
- [-] Basic admin input handling exists, but comprehensive validation/sanitization is not implemented
- [ ] Upload type enforcement and hardening
- [ ] Security middleware such as Helmet

## Accessibility and UX

- [x] Semantic page structure present
- [x] Focus states present
- [x] Keyboard-usable links, buttons, and forms
- [x] Reduced-motion fallback CSS present
- [x] Baseline heading hierarchy present
- [-] Accessibility pass complete
- [-] Contrast verified across all themes and admin/public surfaces
- [ ] Meaningful alt text usage enforced in the public UI

## Performance and Production Readiness

- [x] Lightweight stack without a frontend framework
- [x] Fast server-rendered pages as the primary rendering model
- [ ] Image optimization/compression
- [ ] Lazy-loading of non-critical images
- [ ] Production environment hardening
- [ ] Deployment configuration completed
- [ ] Performance pass completed

## Launch Checklist Alignment

- [-] Homepage complete and responsive
- [x] At least 3 featured projects seeded
- [x] Blog index live
- [x] At least 1 published blog post seeded
- [-] About page complete
- [-] Contact page complete
- [-] Admin login secured
- [x] Admin can create and edit blog posts
- [ ] Admin can update homepage logo
- [ ] Mobile and desktop testing completed formally
- [ ] Accessibility and contrast pass completed formally

## Overall Status Summary

- [x] Foundation, public pages, blog CRUD, project CRUD, settings CRUD, and media upload basics are implemented
- [-] Several “initial release” features are present but not fully wired through
- [ ] Production hardening, polish, and a number of admin/media/security details remain outstanding
