# Personal Website Design Document

## 1. Project Overview

### Project name
**Greg Gagnaux Personal Website**

### Purpose
Build a distinctive personal website for Greg Gagnaux that presents him as a **creative technologist, software engineer, and visual artist**, while also supporting:
- a public-facing homepage
- a blog
- a projects showcase
- an about page
- a contact page
- a private administration area for managing blog posts and configurable site content

The site should feel polished, unique, modern, and memorable, while remaining maintainable and realistic to build.

### Core positioning
The website should communicate that Greg works at the intersection of:
- software engineering
- visual systems
- interaction design
- creative experimentation
- art and sound

This is not meant to feel like a generic developer portfolio or a generic art gallery. It should feel like the website of a thoughtful **creative technologist** with both technical depth and artistic identity.

---

## 2. Product Goals

### Primary goals
1. Establish a strong personal brand and first impression.
2. Showcase selected projects in a curated and visually engaging way.
3. Provide a place for writing, notes, and blog posts.
4. Allow Greg to manage content without editing source files directly.
5. Support future growth without forcing the site to be overly complex on day one.

### Secondary goals
1. Create a reusable visual system that feels distinctive.
2. Keep the content structure simple enough to avoid maintenance friction.
3. Make the site easy to extend with future sections or features.

### Non-goals for initial release
1. Multi-user content management.
2. Complex role-based permissions.
3. Social media feed aggregation.
4. E-commerce.
5. Advanced analytics dashboards inside the admin.

---

## 3. Design Direction

### Chosen design direction
**Signal Lab**

### Summary
A dark, refined, high-contrast personal website with restrained orange accents, strong typography, subtle motion, and a recurring signal/wave/grid motif.

### Desired feel
- modern
- thoughtful
- technical
- creative
- minimal but not sterile
- visually memorable
- curated rather than cluttered

### What the site should not feel like
- a CRUD admin app
- a generic Bootstrap portfolio
- a crowded link hub
- a chaotic art portfolio
- a trendy but shallow landing page

---

## 4. UX Principles

1. **Clarity beats cleverness.**
2. **The homepage must quickly communicate who Greg is and what he builds.**
3. **Content should feel curated, not dumped.**
4. **Visual hierarchy should guide attention intentionally.**
5. **The site should be easy to maintain and update.**
6. **The public website should feel expressive; the admin should feel efficient.**
7. **The design system should support focus, not create distraction.**
8. **Sections should breathe; avoid over-boxing every area.**
9. **Motion should be subtle and meaningful.**
10. **Accessibility and readability are required, not optional.**

---

## 5. Target Audience

### Primary audience
- peers in software and technology
- potential collaborators
- potential clients or employers
- readers interested in Greg’s writing and experiments
- people discovering Greg’s visual art and technical work

### Secondary audience
- friends, creative peers, and general visitors
- people arriving from social media or external links

### Audience needs
Visitors should be able to quickly understand:
- who Greg is
- what kind of work he does
- what projects are worth exploring
- where to find writing and other links
- how to contact him

---

## 6. Technical Stack

### Frontend
- **HTML**
- **CSS**
- **JavaScript**

### Backend
- **Node.js**
- Prefer **Express.js** for routing and API structure

### Database
- **SQLite**

### Rendering approach
Recommended initial approach:
- Server-rendered pages for public content using simple templating (for example EJS, Nunjucks, or Handlebars)
- Vanilla JavaScript for progressive enhancement and interaction
- Admin area can use server-rendered pages plus targeted JavaScript for forms, previews, uploads, and content editing

This keeps complexity low while still allowing a polished experience.

### Why this stack
This stack is fast to build, lightweight, understandable, inexpensive to host, and appropriate for a solo-maintained personal site.

---

## 7. Information Architecture

### Public pages
- `/` — Home
- `/projects` — Projects index
- `/projects/:slug` — Project detail page
- `/blog` — Blog index
- `/blog/:slug` — Blog post detail page
- `/about` — About page
- `/contact` — Contact page

### Admin pages
- `/admin/login`
- `/admin`
- `/admin/posts`
- `/admin/posts/new`
- `/admin/posts/:id/edit`
- `/admin/projects`
- `/admin/projects/new`
- `/admin/projects/:id/edit`
- `/admin/settings`
- `/admin/media`

### Optional future pages
- `/notes`
- `/experiments`
- `/uses`
- `/now`

---

## 8. Homepage Design Specification

### Homepage goals
The homepage must:
1. create a strong first impression
2. establish Greg’s identity clearly
3. feature selected work
4. provide routes into projects, blog, and external work
5. feel more like a designed experience than a directory

### Homepage structure
1. Header
2. Hero
3. Featured Projects
4. What I Do
5. Writing & Notes
6. Elsewhere
7. Footer

---

## 9. Homepage Content

### 9.1 Header

#### Brand line
**Greg Gagnaux**

#### Descriptor
**Creative Technologist • Software Engineer • Visual Artist**

#### Primary navigation
- Home
- Projects
- Blog
- About
- Contact

#### Notes
- Do not place **Admin** in the public navigation for unauthenticated users.
- If Greg is authenticated, admin access can be surfaced discreetly.

---

### 9.2 Hero Section

#### Eyebrow
**PERSONAL WEBSITE / PROJECTS / WRITING / EXPERIMENTS**

#### Headline
**I build software, visual systems, and creative experiments.**

#### Supporting text
**I’m Greg Gagnaux, a software engineer and creative technologist exploring the space between code, design, art, and sound. This site is where I share projects, notes, ideas, and selected work.**

#### Primary CTA buttons
- **View Projects**
- **Visit Toji Studios**

#### Secondary CTA
- **Read the Blog**

#### Optional trust line
**Focused on interactive tools, creative coding, UI experiments, and visual thinking.**

#### Hero visual
A signature visual on the right side using:
- thin orange waveform or signal line
- subtle grid background
- soft glow accents
- restrained animated motion

This visual should act as a recurring brand motif across the site.

---

### 9.3 Featured Projects

#### Section heading
**Featured Projects**

#### Section intro
**Selected tools, experiments, and creative builds.**

#### Card 1
- **Tag:** Music Tool
- **Title:** EP-133 Simulator
- **Description:** A browser-based simulation inspired by the Teenage Engineering EP-133 workflow and interface.
- **Button:** Explore Project

#### Card 2
- **Tag:** Music Theory
- **Title:** Musical Scale Visualizer
- **Description:** An interactive way to explore scales, keys, and playable note relationships through visual feedback.
- **Button:** Explore Project

#### Card 3
- **Tag:** Art / Portfolio
- **Title:** Toji Studios
- **Description:** My visual art portfolio and creative identity system, featuring selected digital work and design experiments.
- **Button:** Visit Site

#### Card 4
- **Tag:** Data / UI Experiment
- **Title:** Periodic Table
- **Description:** A web-based interface experiment that explores structured information through layout, interaction, and visual hierarchy.
- **Button:** Explore Project

---

### 9.4 What I Do

#### Section heading
**What I Do**

#### Body copy
**I create digital experiences that blend engineering, visual thinking, and experimentation. My work spans software tools, interface design, creative coding, interactive music ideas, and visual systems built to explore how people engage with information and technology.**

#### Skill pills
- Software Engineering
- Creative Coding
- UI / UX Design
- Visual Systems
- Interactive Experiments

---

### 9.5 Writing & Notes

#### Section heading
**Writing & Notes**

#### Intro
**Thoughts, process notes, and working ideas on software, creativity, design, and making things that matter.**

#### Example post cards
- **Building at the intersection of code, art, and sound**
- **Notes from interface experiments and creative tooling**
- **What I’m learning while building in public**

#### CTA
- **Read Post**
- or **Visit the Blog** if using a simplified version for launch

If blog content is not ready at launch, use a small placeholder version rather than removing the section entirely.

---

### 9.6 Elsewhere

#### Section heading
**Elsewhere**

#### Intro
**You can also find my work and writing here.**

#### Links
- Toji Studios
- GitHub
- LinkedIn
- Medium
- Instagram

---

### 9.7 Footer

#### Footer copy
**© 2026 Greg Gagnaux. All rights reserved.**

#### Optional line
**Built with curiosity, code, and experimentation.**

---

## 10. Visual Styling Rules

### 10.1 Overall style
Use a dark, refined **Signal Lab** aesthetic:
- deep charcoal / midnight background
- restrained orange highlights
- large clean typography
- thin grid lines
- low-clutter layouts
- strong spacing
- subtle animation

### 10.2 Color palette

#### Core colors
- Page background: `#0A0D12`
- Section background / panels: `#10151D`
- Elevated card background: `#121923`
- Primary text: `#F3F5F7`
- Secondary text: `#A8B3C2`
- Muted text: `#7C8898`
- Border / divider: `rgba(255,255,255,0.10)`

#### Accent colors
- Primary accent orange: `#FF5A1F`
- Hover orange: `#FF6E36`
- Glow orange: `rgba(255,90,31,0.35)`
- Accent line: `rgba(255,90,31,0.55)`

### 10.3 Typography

#### Recommended fonts
- Headings: **Space Grotesk**
- Body/UI text: **Inter**

#### Type scale
- Hero eyebrow: 13px / 600 / uppercase / letter-spacing 0.14em
- H1: 64px / 700 / line-height 1.05
- H2: 40px / 700 / line-height 1.1
- H3: 30px / 650 / line-height 1.15
- Body large: 21px / 400 / line-height 1.6
- Body: 18px / 400 / line-height 1.65
- Small UI text: 15px / 500 / line-height 1.4

### 10.4 Layout rules
- Max content width: **1240px**
- Use a 12-column grid on desktop
- Hero should be open and spacious
- Avoid enclosing every major section in identical bordered boxes
- Use cards selectively and intentionally

### 10.5 Buttons

#### Primary button
- Background: `#FF5A1F`
- Text: `#FFFFFF`
- Radius: `14px`
- Padding: `14px 22px`
- Font size: `16px`
- Font weight: `600`

#### Secondary button
- Transparent background
- 1px subtle border
- Same radius and padding as primary button

#### Text link
- understated by default
- orange on hover
- may include a small directional arrow

### 10.6 Cards
- Elevated surface
- 1px subtle border
- 20px border radius
- low-contrast shadow
- hover lift up to 4px
- subtle increase in border brightness on hover

### 10.7 Motion
Allowed motion:
- slow waveform drift
- soft card hover lift
- faint glow pulse
- restrained transitions

Avoid:
- heavy parallax
- flashy scaling
- continuous distracting animation loops

---

## 11. Blog Design and Functional Requirements

### Blog goals
The blog should allow Greg to publish writing without friction and make the site feel active, thoughtful, and alive.

### Public blog requirements
1. Blog index page with list of posts.
2. Individual blog post pages.
3. Post metadata:
   - title
   - slug
   - publish date
   - updated date
   - excerpt
   - tags
   - status
   - featured image (optional)
4. Ability to feature selected posts on the homepage.
5. Clean, readable long-form typography.
6. Optional support for draft vs published state.

### Blog UX requirements
- easy scanning on index page
- readable content width
- visible publish date
- optional reading time
- related posts or more posts section optional for later

### Blog writing style support
The design should support thoughtful, essay-like writing and short process notes equally well.

### Blog content model
Each post should support:
- title
- slug
- excerpt
- body content
- tags
- cover image
- published flag
- featured flag
- created timestamp
- updated timestamp
- published timestamp

### Content format recommendation
Use one of these approaches:
1. Store raw HTML content in SQLite using a rich text editor in admin
2. Store Markdown and render it to HTML for public pages

Recommended approach:
- Store **Markdown** in the database
- Render to HTML on display

This keeps writing portable and works well for a technical/personal site.

---

## 12. Admin Design and Functional Requirements

### Admin goals
The administration section should let Greg manage the site without touching code or database records manually.

### Admin scope for initial release
1. Manage blog posts
2. Manage project entries
3. Manage basic site settings
4. Manage logo and branding assets
5. Manage homepage text blocks and section visibility

### Admin information architecture
- Dashboard
- Posts
- Projects
- Settings
- Media

### Admin dashboard
The dashboard should provide quick access to:
- recent posts
- draft count
- published post count
- project count
- quick links to create content
- current site title and logo preview

### Admin posts management
Required features:
- list all posts
- filter by draft/published
- create post
- edit post
- delete post
- preview post
- save draft
- publish/unpublish post
- manage tags

### Admin projects management
Required features:
- list projects
- create project
- edit project
- delete project
- set featured status
- set external/internal link
- upload thumbnail/cover image
- define order/priority on homepage or projects page

### Admin settings management
Required editable settings:
- site title
- site descriptor
- logo image
- hero headline
- hero supporting text
- hero CTA labels and links
- footer text
- external profile links
- section visibility toggles

### Admin media management
Recommended features:
- upload images
- browse uploaded assets
- delete unused images
- select image for posts/projects/logo

### Admin UX direction
Unlike the public site, the admin should prioritize:
- speed
- clarity
- low cognitive friction
- obvious workflows
- strong form layout

The admin does not need the same expressive branding treatment as the public site. It should feel clean, dark, efficient, and consistent with the overall site identity.

---

## 13. Backend Functional Requirements

### Authentication
Initial recommendation:
- single-admin login
- secure session-based authentication
- password hashing using bcrypt
- protected admin routes

### Backend capabilities
The backend must support:
- public page rendering
- blog CRUD
- project CRUD
- settings CRUD
- media uploads
- authentication and session management
- slug generation and uniqueness checks

### Suggested Express structure
- `routes/public/*`
- `routes/admin/*`
- `routes/api/*`
- `controllers/*`
- `services/*`
- `db/*`
- `middleware/*`
- `views/*`
- `public/*`

### Suggested server responsibilities
- load content from SQLite
- render public pages using templates
- validate admin input
- protect admin routes
- process uploads
- render Markdown to HTML

---

## 14. Database Design

### Recommended tables

#### `users`
For single-admin support now, extensible later.

Fields:
- `id`
- `username`
- `password_hash`
- `created_at`
- `updated_at`

#### `posts`
Fields:
- `id`
- `title`
- `slug`
- `excerpt`
- `body_markdown`
- `body_html` (optional cached field)
- `cover_image_id` (nullable)
- `status` (`draft` or `published`)
- `is_featured`
- `published_at`
- `created_at`
- `updated_at`

#### `post_tags`
Fields:
- `id`
- `post_id`
- `tag`

#### `projects`
Fields:
- `id`
- `title`
- `slug`
- `summary`
- `description_markdown`
- `thumbnail_image_id` (nullable)
- `cover_image_id` (nullable)
- `project_type`
- `external_url` (nullable)
- `internal_url` (nullable)
- `is_featured`
- `display_order`
- `created_at`
- `updated_at`

#### `settings`
Fields:
- `id`
- `setting_key`
- `setting_value`
- `updated_at`

This key/value approach keeps settings flexible.

#### `media`
Fields:
- `id`
- `filename`
- `original_name`
- `mime_type`
- `file_size`
- `width` (nullable)
- `height` (nullable)
- `alt_text` (nullable)
- `created_at`

---

## 15. API and Route Considerations

### Public routes
- `GET /`
- `GET /projects`
- `GET /projects/:slug`
- `GET /blog`
- `GET /blog/:slug`
- `GET /about`
- `GET /contact`

### Admin routes
- `GET /admin/login`
- `POST /admin/login`
- `POST /admin/logout`
- `GET /admin`
- `GET /admin/posts`
- `GET /admin/posts/new`
- `POST /admin/posts`
- `GET /admin/posts/:id/edit`
- `POST /admin/posts/:id`
- `POST /admin/posts/:id/delete`
- `GET /admin/projects`
- `GET /admin/projects/new`
- `POST /admin/projects`
- `GET /admin/projects/:id/edit`
- `POST /admin/projects/:id`
- `POST /admin/projects/:id/delete`
- `GET /admin/settings`
- `POST /admin/settings`
- `GET /admin/media`
- `POST /admin/media/upload`
- `POST /admin/media/:id/delete`

### Optional JSON APIs
These can be added later if needed for richer client-side interactions.

---

## 16. Accessibility Requirements

1. Meet strong baseline accessibility expectations.
2. Ensure sufficient contrast ratios.
3. Keyboard-accessible navigation and buttons.
4. Visible focus states.
5. Semantic HTML structure.
6. Meaningful alt text support for images.
7. Clear heading hierarchy.
8. Reduce motion where appropriate.

### Special note
Any animated hero effects should respect reduced-motion user preferences.

---

## 17. Performance Requirements

1. Fast first-load homepage.
2. Optimize and compress images.
3. Avoid unnecessary JavaScript frameworks.
4. Minimize render-blocking assets.
5. Lazy-load non-critical images.
6. Keep the admin responsive even with growing content.

---

## 18. Content Strategy

### Core content types
- homepage hero messaging
- featured projects
- blog posts
- project detail pages
- about page narrative
- external links

### Messaging rules
The site voice should feel:
- thoughtful
- clear
- curious
- competent
- creative
- restrained

Avoid:
- generic corporate language
- overstuffed role lists
- vague aspirational copy
- overly decorative messaging

---

## 19. Security Considerations

1. Passwords must be securely hashed.
2. Admin routes must be protected by session authentication.
3. Validate and sanitize all admin input.
4. Sanitize Markdown-rendered HTML output.
5. Protect file uploads by type and size.
6. Use CSRF protection for admin forms if possible.
7. Do not expose admin links publicly unless authenticated.

---

## 20. Recommended Project Structure

```text
/site
  /src
    /controllers
    /db
    /middleware
    /models
    /routes
      /public
      /admin
      /api
    /services
    /utils
    /views
      /layouts
      /partials
      /pages
      /admin
  /public
    /css
    /js
    /images
    /uploads
  /scripts
  package.json
  server.js
```

---

## 21. Implementation Phases

### Phase 1 — Foundation
- set up Node.js app
- configure Express
- configure SQLite
- create base layout templates
- implement visual design tokens and CSS foundations
- build public header/footer/layout

### Phase 2 — Homepage and public pages
- build homepage hero
- build featured project cards
- build projects page
- build about/contact/blog index placeholders
- implement responsive behavior

### Phase 3 — Blog system
- create posts table
- build admin post CRUD
- implement Markdown rendering
- build blog index and detail pages
- add featured blog content to homepage

### Phase 4 — Project management
- create projects table
- build admin project CRUD
- build projects index/detail pages
- connect featured project selection to homepage

### Phase 5 — Settings and site customization
- create settings table
- build settings UI for logo, hero text, footer, and links
- support section visibility toggles

### Phase 6 — Media management and polish
- image uploads
- media selection UI
- accessibility pass
- performance pass
- content cleanup
- deployment hardening

---

## 22. Launch Checklist

- homepage complete and responsive
- at least 3 featured projects live
- blog index live
- at least 1 blog post published
- about page complete
- contact page complete
- admin login secured
- admin can create and edit blog posts
- admin can update homepage text and logo
- site tested on mobile and desktop
- accessibility and contrast pass complete

---

## 23. Summary

This website should be a focused, expressive personal platform that combines Greg’s technical credibility with his creative identity. The public experience should feel refined, original, and memorable. The admin experience should make publishing and updating content easy. The chosen implementation stack of **HTML, CSS, JavaScript, Node.js, and SQLite** is a strong fit for a maintainable, solo-built site with room to grow.

The design direction is intentionally opinionated:
- strong hero
- curated featured projects
- thoughtful writing presence
- restrained but memorable visual language
- clean admin tools for managing content and settings

This should result in a personal site that is both achievable and distinctive.


---

## 24. Technical Implementation Document

### 24.1 Implementation approach
The site should be built as a server-rendered Node.js application with a clear separation between:
- public presentation
- admin workflows
- data access
- reusable view partials
- shared design tokens and UI primitives

Recommended approach:
- **Express.js** for routing and middleware
- **EJS** for templating
- **better-sqlite3** or **sqlite3** for SQLite access
- **express-session** for admin authentication sessions
- **bcrypt** for password hashing
- **marked** or **markdown-it** for Markdown rendering
- **DOMPurify** with JSDOM, or another server-safe sanitizer, for sanitizing rendered HTML
- **multer** for media uploads

### 24.2 Recommended npm packages
Core:
- `express`
- `ejs`
- `better-sqlite3`
- `express-session`
- `connect-sqlite3` or file-backed session storage option
- `bcrypt`
- `dotenv`
- `multer`
- `marked` or `markdown-it`
- `sanitize-html` or equivalent HTML sanitization package
- `slugify`
- `morgan`
- `helmet`

Helpful utilities:
- `dayjs`
- `nanoid`
- `sharp` for image resizing/optimization
- `csurf` if CSRF protection is added immediately

---

## 25. Detailed Project Structure

```text
/site
  /src
    /config
      env.js
      database.js
      session.js
    /controllers
      adminAuthController.js
      adminDashboardController.js
      adminMediaController.js
      adminPostsController.js
      adminProjectsController.js
      adminSettingsController.js
      publicBlogController.js
      publicPagesController.js
      publicProjectsController.js
    /db
      schema.sql
      seed.sql
      migrate.js
    /middleware
      authRequired.js
      attachGlobals.js
      errorHandler.js
      notFound.js
      validatePost.js
      validateProject.js
      validateSettings.js
    /models
      mediaModel.js
      postModel.js
      projectModel.js
      settingsModel.js
      userModel.js
    /routes
      /admin
        authRoutes.js
        dashboardRoutes.js
        mediaRoutes.js
        postsRoutes.js
        projectsRoutes.js
        settingsRoutes.js
      /public
        blogRoutes.js
        pageRoutes.js
        projectRoutes.js
    /services
      markdownService.js
      mediaService.js
      settingsService.js
      slugService.js
    /utils
      formatDate.js
      readingTime.js
      text.js
    /views
      /layouts
        main.ejs
        admin.ejs
      /partials
        head.ejs
        siteHeader.ejs
        siteFooter.ejs
        hero.ejs
        projectCard.ejs
        blogCard.ejs
        flashMessage.ejs
      /pages
        home.ejs
        about.ejs
        contact.ejs
        blog-index.ejs
        blog-post.ejs
        projects-index.ejs
        project-detail.ejs
      /admin
        login.ejs
        dashboard.ejs
        posts-index.ejs
        posts-form.ejs
        projects-index.ejs
        projects-form.ejs
        settings.ejs
        media-index.ejs
    app.js
  /public
    /css
      tokens.css
      base.css
      components.css
      pages.css
      admin.css
    /js
      site.js
      hero-signal.js
      admin.js
      media-picker.js
    /images
    /uploads
  /scripts
    create-admin.js
  .env
  package.json
  server.js
```

### 25.1 Structure notes
- Keep public and admin concerns separate.
- Keep business logic out of route files.
- Treat views as composable templates, not giant monoliths.
- Prefer shared components for cards, buttons, forms, and layout sections.

---

## 26. Template and View Breakdown

### 26.1 Public layout
`main.ejs` should provide:
- `<head>` metadata
- font loading
- site header
- main content container
- footer
- global scripts

### 26.2 Admin layout
`admin.ejs` should provide:
- compact header
- sidebar or top navigation for admin sections
- flash message area
- main content area for forms/tables

### 26.3 Public page templates

#### `home.ejs`
Sections:
- Header
- Hero
- Featured Projects
- What I Do
- Writing & Notes
- Elsewhere
- Footer

#### `blog-index.ejs`
Sections:
- Page hero / title
- Optional intro
- post listing grid or stacked cards
- pagination if needed later

#### `blog-post.ejs`
Sections:
- post title
- metadata row
- cover image optional
- Markdown-rendered article body
- optional tags
- optional next/previous post links

#### `projects-index.ejs`
Sections:
- page title and intro
- project grid
- optional filter by type later

#### `project-detail.ejs`
Sections:
- hero/title area
- project summary
- body content
- screenshots/media
- external/internal links

### 26.4 Admin templates

#### `posts-index.ejs`
- posts table
- status badges
- quick actions
- filters for draft/published
- create new post CTA

#### `posts-form.ejs`
- title
- slug
- excerpt
- Markdown body editor
- tags
- cover image selector
- status selector
- featured toggle
- save draft / publish buttons

#### `projects-form.ejs`
- title
- slug
- summary
- description Markdown
- type
- thumbnail/cover image
- external/internal link
- featured toggle
- display order

#### `settings.ejs`
Grouped sections:
- site identity
- homepage hero
- footer
- external links
- homepage visibility toggles

---

## 27. Database Schema SQL

### 27.1 Initial schema

```sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS media (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  alt_text TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  body_markdown TEXT NOT NULL,
  body_html TEXT,
  cover_image_id INTEGER,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'published')),
  is_featured INTEGER NOT NULL DEFAULT 0,
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cover_image_id) REFERENCES media(id)
);

CREATE TABLE IF NOT EXISTS post_tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  tag TEXT NOT NULL,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  summary TEXT NOT NULL,
  description_markdown TEXT,
  thumbnail_image_id INTEGER,
  cover_image_id INTEGER,
  project_type TEXT,
  external_url TEXT,
  internal_url TEXT,
  is_featured INTEGER NOT NULL DEFAULT 0,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (thumbnail_image_id) REFERENCES media(id),
  FOREIGN KEY (cover_image_id) REFERENCES media(id)
);

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 27.2 Recommended seed settings

```sql
INSERT OR IGNORE INTO settings (setting_key, setting_value) VALUES
('site_title', 'Greg Gagnaux'),
('site_descriptor', 'Creative Technologist • Software Engineer • Visual Artist'),
('hero_eyebrow', 'PERSONAL WEBSITE / PROJECTS / WRITING / EXPERIMENTS'),
('hero_headline', 'I build software, visual systems, and creative experiments.'),
('hero_body', 'I’m Greg Gagnaux, a software engineer and creative technologist exploring the space between code, design, art, and sound.'),
('hero_primary_cta_label', 'View Projects'),
('hero_primary_cta_url', '/projects'),
('hero_secondary_cta_label', 'Visit Toji Studios'),
('hero_secondary_cta_url', 'https://www.toji.studio'),
('hero_text_link_label', 'Read the Blog'),
('hero_text_link_url', '/blog'),
('footer_text', '© 2026 Greg Gagnaux. All rights reserved.'),
('footer_subtext', 'Built with curiosity, code, and experimentation.');
```

---

## 28. Content Models and Validation Rules

### 28.1 Post validation rules
Required:
- title
- slug
- body_markdown
- status

Optional:
- excerpt
- cover image
- tags
- featured flag

Validation rules:
- title: 3 to 140 characters
- slug: lowercase URL-safe unique text
- excerpt: max 300 characters recommended
- body_markdown: minimum practical length
- status: `draft` or `published`

### 28.2 Project validation rules
Required:
- title
- slug
- summary

Optional:
- Markdown description
- project type
- internal/external URL
- featured flag
- display order
- images

Validation rules:
- title: 3 to 120 characters
- slug: lowercase URL-safe unique text
- summary: 20 to 220 characters recommended
- display order: integer >= 0

### 28.3 Settings validation rules
Validate by type:
- text fields trimmed
- URLs must be valid absolute or site-relative URLs depending on field
- section toggles stored as `0` or `1` or boolean-like strings normalized server-side

---

## 29. Route Map and Responsibilities

### 29.1 Public routes

#### `GET /`
Controller responsibilities:
- load homepage settings
- load featured projects
- load featured or latest blog posts
- load external links/settings
- render `home.ejs`

#### `GET /blog`
- load published posts ordered by `published_at DESC`
- render `blog-index.ejs`

#### `GET /blog/:slug`
- load single published post
- render Markdown to HTML if needed
- sanitize HTML
- render `blog-post.ejs`

#### `GET /projects`
- load all public projects sorted by featured/display order/title
- render `projects-index.ejs`

#### `GET /projects/:slug`
- load single project
- render `project-detail.ejs`

#### `GET /about`
- render static or settings-backed content

#### `GET /contact`
- render contact page

### 29.2 Admin auth routes

#### `GET /admin/login`
- render login form

#### `POST /admin/login`
- verify username/password
- create session
- redirect to admin dashboard

#### `POST /admin/logout`
- destroy session
- redirect to login

### 29.3 Admin dashboard routes

#### `GET /admin`
- load counts and recent content
- render dashboard summary

### 29.4 Admin post routes

#### `GET /admin/posts`
- list all posts
- filter by status when querystring present

#### `GET /admin/posts/new`
- render empty post form

#### `POST /admin/posts`
- validate input
- generate or normalize slug
- optionally generate HTML cache from Markdown
- insert post and tags

#### `GET /admin/posts/:id/edit`
- load post and tags
- render form

#### `POST /admin/posts/:id`
- validate input
- update post and tag relationships

#### `POST /admin/posts/:id/delete`
- delete post and dependent tag rows

### 29.5 Admin project routes
Same pattern as posts, with project-specific fields and featured/display-order support.

### 29.6 Admin settings routes

#### `GET /admin/settings`
- load grouped settings
- render settings form

#### `POST /admin/settings`
- validate fields
- update each setting in key/value table

### 29.7 Admin media routes

#### `GET /admin/media`
- list uploaded assets

#### `POST /admin/media/upload`
- process upload via `multer`
- optionally optimize via `sharp`
- store media record in DB

#### `POST /admin/media/:id/delete`
- remove DB record
- remove file from filesystem if safe

---

## 30. Controller / Service Layer Plan

### 30.1 Controllers should handle
- request parsing
- invoking model/service methods
- selecting views
- redirect/render decisions

### 30.2 Services should handle
- Markdown rendering and sanitization
- slug generation
- site settings aggregation
- image processing
- media file naming

### 30.3 Models should handle
- SQL access only
- object mapping and basic persistence helpers

This separation keeps the app maintainable and easy to reason about.

---

## 31. Admin CRUD Workflows

### 31.1 Blog post creation flow
1. Admin clicks **New Post**.
2. Form opens with title, excerpt, Markdown body, tags, cover image, status, featured toggle.
3. Slug auto-generates from title but remains editable.
4. Admin saves as draft or publishes.
5. On save:
   - validate fields
   - generate sanitized HTML from Markdown
   - store record
   - redirect back to edit page with success message

### 31.2 Blog post editing flow
1. Admin opens existing post.
2. Form loads current content.
3. Admin edits content and metadata.
4. Save action updates `updated_at` and optionally `published_at`.

### 31.3 Project creation flow
1. Admin clicks **New Project**.
2. Form opens with summary, type, images, links, featured toggle, display order.
3. Save action writes record.
4. Featured projects become eligible for homepage display.

### 31.4 Settings workflow
1. Admin opens settings.
2. Settings grouped by category.
3. Save updates key/value pairs.
4. Public homepage reflects changes without code edits.

### 31.5 Media workflow
1. Admin uploads image.
2. Server validates mime type and size.
3. File is optimized, stored, and indexed.
4. Image becomes selectable for project, post, or logo fields.

---

## 32. Markdown Rendering Strategy

### Recommended approach
Store Markdown in DB, render to HTML on save and/or on read.

### Preferred workflow
- save raw Markdown to `body_markdown`
- render sanitized HTML to `body_html` during save
- public pages use cached `body_html`

Benefits:
- better runtime performance
- preserves source portability
- easier preview generation in admin

### Markdown features to support initially
- headings
- paragraphs
- emphasis
- lists
- links
- code blocks
- blockquotes
- inline code
- images optional later

---

## 33. Media Upload Strategy

### Upload rules
- allow image types only for initial release: PNG, JPG, JPEG, WebP, SVG only if carefully validated
- file size limit recommended: 5 MB for images
- generate unique filenames
- store upload metadata in DB

### Recommended directory strategy
`/public/uploads/YYYY/MM/filename.ext`

### Image handling
Use `sharp` to:
- inspect dimensions
- generate optimized versions if desired
- create smaller thumbnails later if needed

### Alt text
Media records should support optional `alt_text` for accessibility.

---

## 34. Frontend Styling Architecture

### 34.1 CSS organization
`tokens.css`
- colors
- spacing scale
- radii
- typography scale
- shadows
- z-index values

`base.css`
- resets
- body styles
- typography defaults
- links
- buttons base

`components.css`
- cards
- nav
- hero
- pills
- forms
- tables
- alerts

`pages.css`
- page-specific rules for home/blog/projects/about/contact

`admin.css`
- admin layout
- forms
- admin tables
- media grid

### 34.2 Design token recommendations
Example token groups:
- `--color-bg`
- `--color-surface`
- `--color-text`
- `--color-accent`
- `--space-1` through `--space-10`
- `--radius-md`, `--radius-lg`, `--radius-xl`
- `--shadow-card`
- `--transition-fast`, `--transition-base`

---

## 35. JavaScript Responsibilities

### Public JS
- hero waveform/signal animation
- mobile nav toggle
- subtle progressive enhancements

### Admin JS
- slug auto-generation
- Markdown preview toggle
- media picker integration
- form quality-of-life helpers

Rule:
Do not depend on heavy frontend frameworks for the initial version.

---

## 36. Authentication and Session Plan

### Authentication model
Single-admin login for v1.

### Security flow
- username/password form
- password hashed using `bcrypt`
- session stored server-side
- admin routes protected by middleware

### Middleware
`authRequired.js` should:
- check session user
- redirect unauthenticated requests to `/admin/login`

### Initial admin bootstrap
Use a script such as `scripts/create-admin.js` to create the first admin user.

---

## 37. Error Handling and UX States

### Public side
- custom 404 page
- generic 500 page
- graceful empty states for no posts/projects

### Admin side
- validation error summaries
- inline field errors when practical
- clear success messages after save/update/delete
- confirmation before destructive actions

---

## 38. Deployment Considerations

### Hosting suitability
This stack works well on:
- VPS hosting
- lightweight Node-capable hosts
- Docker deployment later if desired

### Production requirements
- persistent writable uploads directory
- persistent SQLite file storage
- environment variable support
- HTTPS
- secure cookie/session settings in production

### Environment variables
Recommended:
- `PORT`
- `NODE_ENV`
- `SESSION_SECRET`
- `SQLITE_PATH`
- `BASE_URL`

---

## 39. Minimum Viable Build Order

### Build order recommendation
1. Scaffold project and base Express app.
2. Set up SQLite and schema.
3. Implement layouts, design tokens, and base CSS.
4. Build homepage using static seed data.
5. Build blog public pages using seed data.
6. Add admin authentication.
7. Build admin post CRUD.
8. Connect blog content to homepage.
9. Build admin settings for hero/logo/footer.
10. Build admin project CRUD.
11. Add media uploads.
12. Polish, test, and deploy.

---

## 40. Immediate Next Implementation Targets

The most productive next artifacts to create are:
1. `schema.sql`
2. route map files
3. base `main.ejs` and `home.ejs`
4. CSS token file
5. admin login and dashboard skeleton
6. post CRUD forms and controller stubs

These will establish the structure needed to move from design into implementation cleanly.

