# Project Carousel Storage Design

## Goal

Move project carousel image uploads out of the shared `public/uploads/` area and into each project's own directory under `public/projects/`.

The main goal is to keep a project's working files, preview assets, and carousel images close together so the project remains self-contained on disk.

## Current state

Today, project carousel screenshots are already treated as a distinct logical asset type in the application:

- they are stored in the `media` table with `media_role = "project_screenshot"`
- they are managed through `projectScreenshotService`
- they are uploaded from the `Edit Project` and `Create Project` flows

However, they are still physically stored in the shared `public/uploads/` directory.

This means project-specific carousel files are separated from the project folders that already exist in `public/projects/`.

## Product direction

### Core principle

A project's carousel images should live with that project.

Recommended storage layout:

- `public/projects/<project-slug>/index.html` for the project itself when applicable
- `public/projects/<project-slug>/carousel/1.png`
- `public/projects/<project-slug>/carousel/2.png`
- `public/projects/<project-slug>/carousel/3.png`

Recommended public URLs:

- `/projects/<project-slug>/carousel/1.png`
- `/projects/<project-slug>/carousel/2.png`

This keeps project artifacts grouped together and makes the file system easier to reason about.

## Why this is a good fit

The application already treats project pages as living under `public/projects/`.

Using the same top-level location for carousel assets provides:

- better project-level organization
- easier manual inspection of project assets
- easier backup or migration of a single project
- easier cleanup when a project is deleted
- a clearer boundary between media-library uploads and project-specific assets

## Scope

### In scope

- Move project carousel screenshot storage to `public/projects/<slug>/carousel/`
- Update new project and edit project upload flows
- Update draft screenshot handling
- Update project rename behavior so carousel assets remain valid
- Update public and admin rendering to use the new paths
- Add tests for storage and rendering behavior
- Add a migration path for existing screenshot assets in `public/uploads/`

### Out of scope for the first implementation

- Moving media-library assets out of `public/uploads/`
- Moving blog post images out of `public/uploads/`
- Building a generalized asset pipeline for all asset classes
- CDN or remote object storage support

## Proposed workflow

## 1. New project draft uploads

When a project has not been saved yet, screenshots should be stored in a draft-specific temp location.

Recommended draft layout:

- `public/projects/__drafts/<upload-session-id>/carousel/1.png`
- `public/projects/__drafts/<upload-session-id>/carousel/2.png`

Why:

- draft uploads still need a stable place on disk before a slug exists
- draft assets remain separated from saved project folders
- promotion into the final project folder becomes straightforward

## 2. Create project

When the project is first saved:

- the project record is created and its slug becomes authoritative
- draft screenshots are promoted into `public/projects/<slug>/carousel/`
- filenames are normalized into carousel order
- stored paths or URLs are updated if needed

## 3. Edit project

When editing an existing project:

- new carousel uploads go directly into `public/projects/<slug>/carousel/`
- removing screenshots deletes files from that folder
- reordering screenshots updates the logical order and, if needed, the filenames

## 4. Rename project slug

If a project's slug changes:

- the project folder path changes
- the carousel folder should move with it
- existing screenshot URLs must remain valid after the rename

This is an important design constraint because the filesystem path and the public URL both depend on the slug.

## 5. Delete project

Deleting a project should remove:

- its screenshot rows from the database
- its files from `public/projects/<slug>/carousel/`

The rest of the project folder should only be deleted if that matches the broader product rule for project deletion.

Because `public/projects/` may contain hand-maintained working files, the implementation should be conservative and avoid deleting the entire project folder automatically unless we are certain that is desired.

## File structure recommendation

### Saved project screenshots

Recommended:

- `public/projects/<slug>/carousel/1.png`
- `public/projects/<slug>/carousel/2.png`

Benefits:

- simple and readable URLs
- the carousel order is visible from filenames
- the homepage carousel JS can continue to work with a predictable numbering scheme if desired

### Draft screenshots

Recommended:

- `public/projects/__drafts/<upload-session-id>/carousel/1.png`
- `public/projects/__drafts/<upload-session-id>/carousel/2.png`

Benefits:

- draft assets are isolated from saved project folders
- cleanup is easier
- promotion is explicit and predictable

## URL strategy

Recommended public URL format:

- `/projects/<slug>/carousel/1.png`
- `/projects/<slug>/carousel/2.png`

This is preferable to keeping carousel images under `/uploads/` because the URL now reflects project ownership directly.

## Data model recommendation

### Current model

The `media` table stores screenshot rows with fields like `filename`, `project_id`, and `display_order`.

### Recommended change

Add an explicit `storage_path` field for project screenshots.

Recommended value examples:

- `projects/synth-sandbox/carousel/1.png`
- `projects/synth-sandbox/carousel/2.png`

### Why explicit paths are better than filename-only storage

Today the code assumes screenshots can be reconstructed from a filename and naming convention.

That works, but it tightly couples rendering to a storage rule.

An explicit path gives us:

- safer slug rename handling
- easier future migrations
- more flexible folder structures
- less hardcoded path assembly in templates and JS

### Alternative

Keep storing only the filename and always derive the rest from the project slug.

This is simpler short term, but more brittle long term.

Recommendation: use an explicit relative path for carousel screenshots.

## Rendering strategy

### Public homepage carousel

The homepage currently relies on a prefix-based image pattern for carousel screenshots.

Recommendation:

- move away from prefix reconstruction
- return explicit screenshot URLs from the project service
- let the template and carousel JS use concrete URLs rather than inferred filenames

This makes the carousel more robust and removes assumptions about numbering or file extensions.

### Admin edit screen

The admin project form should also use explicit screenshot URLs instead of building them from `/uploads/{{ screenshot.filename }}`.

That keeps admin preview behavior aligned with the new storage model.

## Service design

### projectScreenshotService responsibilities

This service should own:

- path generation for saved project screenshots
- path generation for draft project screenshots
- promotion from draft storage to saved project storage
- rename or move behavior when a slug changes
- deletion of screenshot files
- URL or path metadata returned to the rest of the app

### projectService responsibilities

This service should:

- expose screenshot metadata for rendering
- stop relying on `screenshot_prefix` alone
- return either a list of screenshot URLs or both URLs and order metadata

## Migration strategy

### Recommended rollout

#### Stage 1: Add backward-compatible support

- support explicit screenshot paths in code
- support rendering from both the old and new storage layouts during migration

#### Stage 2: Move existing screenshot files

- move existing project screenshot files from `public/uploads/` into `public/projects/<slug>/carousel/`
- update database rows to point at the new relative paths

#### Stage 3: Remove legacy assumptions

- remove old `/uploads/<filename>` handling for project screenshots once migration is complete

### Why staged migration is safer

This avoids breaking existing projects while the new structure is introduced.

## Risks and tradeoffs

### Risk: Slug changes affect URLs and folders

Because the project slug is part of the new path, renaming a slug becomes more sensitive.

Response:

- centralize path generation in one service
- implement rename as a deliberate file move operation
- cover rename behavior with tests

### Risk: Project deletion could remove hand-maintained files

If a project folder also contains manual working files, deleting the entire folder could be destructive.

Response:

- only delete the `carousel/` subfolder automatically at first
- leave the main project folder intact unless the product rules explicitly say otherwise

### Risk: Draft cleanup could leave orphaned files

Draft uploads need a cleanup strategy.

Response:

- track drafts in the DB as currently done
- delete draft folders when drafts are promoted or removed
- consider a later cleanup command for abandoned draft sessions

### Risk: Existing homepage JS assumes a prefix-based pattern

The current carousel code expects image filenames to be built from a prefix plus index.

Response:

- shift the public carousel to explicit URL arrays
- keep the JS driven by concrete image URLs rather than generated filenames

## Testing approach

The new workflow should be covered with tests for:

- draft screenshot upload path generation
- screenshot promotion into a saved project folder
- edit project uploads storing into the saved project carousel folder
- project slug rename moving carousel assets correctly
- deletion removing carousel files only
- homepage rendering using the new URLs
- admin edit rendering using the new URLs
- migration behavior for legacy screenshots

## Success criteria

This redesign should be considered successful when:

- new carousel screenshots are stored under `public/projects/<slug>/carousel/`
- draft screenshots are stored under a draft project area rather than `public/uploads/`
- public and admin rendering no longer depend on `/uploads/` for project screenshots
- slug renames preserve carousel assets correctly
- existing project screenshots can be migrated safely
- the implementation does not accidentally delete unrelated project working files

## Recommendation

Proceed with a path-explicit design.

That means:

- store project carousel assets under `public/projects/<slug>/carousel/`
- add a `storage_path` field for screenshot storage
- return explicit screenshot URLs from services
- migrate away from the existing prefix-based rendering assumptions

This is the cleanest long-term model and fits the way the project directory is already being used.


