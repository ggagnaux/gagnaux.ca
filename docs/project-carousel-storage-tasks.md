# Project Carousel Storage Tasks

## Objective

Redesign project carousel image storage so project screenshots are stored alongside each project's files under `public/projects/` instead of in the shared `public/uploads/` directory.

## Current status

- [ ] Project carousel screenshots are still written to `public/uploads/`
- [ ] Admin project screenshot previews still read from `/uploads/...`
- [ ] Homepage carousel rendering still depends on the current screenshot filename convention
- [ ] Draft project screenshots are still stored in the shared uploads area
- [ ] No migration exists yet for legacy project screenshots already stored in `public/uploads/`

## Phase 1: Finalize storage model

- [ ] Confirm the saved screenshot layout as `public/projects/<slug>/carousel/`
- [ ] Confirm the draft screenshot layout under `public/projects/__drafts/<upload-session-id>/carousel/`
- [ ] Confirm whether screenshot filenames stay sequential such as `1.png`, `2.png`, `3.png`
- [x] Confirm that deleting a project should remove `carousel/` by default, with an explicit opt-in option to remove the entire project folder
- [ ] Confirm the public URL format as `/projects/<slug>/carousel/<filename>`

## Phase 2: Data model changes

- [x] Decide on `storage_path` as the DB field for explicit screenshot paths
- [ ] Add the new field to the `media` table for project screenshots if approved
- [ ] Update database initialization and migration logic to support the new field safely
- [ ] Ensure existing media-library and post-image behavior is not affected

## Phase 3: Screenshot service refactor

- [ ] Update `src/services/projectScreenshotService.js` to build saved screenshot paths under `public/projects/<slug>/carousel/`
- [ ] Update draft screenshot saving to use the draft project directory instead of `public/uploads/`
- [ ] Refactor screenshot promotion from draft to saved project storage
- [ ] Refactor screenshot reorder logic to work within the carousel folder
- [ ] Refactor screenshot delete logic to remove files from the carousel folder only
- [ ] Refactor slug rename handling to move or rebuild screenshot paths safely
- [ ] Add path helper functions so storage rules live in one place

## Phase 4: Project service and rendering changes

- [ ] Update `src/services/projectService.js` to return explicit screenshot URLs or screenshot asset objects
- [ ] Remove homepage dependence on the current `screenshot_prefix` convention if possible
- [ ] Update `views/public/home.njk` to consume explicit screenshot URLs
- [ ] Update `public/assets/js/site.js` carousel logic to use explicit URL lists if needed
- [ ] Update `views/admin/projects/form.njk` to preview screenshots from the new location
- [ ] Ensure the edit project screen and create project screen render draft and saved screenshots correctly

## Phase 5: Route and controller updates

- [ ] Update `src/controllers/adminProjectsController.js` if redirect, promotion, or rewrite behavior changes
- [ ] Review whether markdown path rewriting is still needed for project screenshots
- [ ] Ensure upload, delete, and reorder routes continue to work with the new storage model
- [ ] Verify project edits with no screenshots still behave correctly

## Phase 6: Migration for existing screenshots

- [ ] Identify existing project screenshot files currently stored in `public/uploads/`
- [ ] Map each legacy screenshot to its owning project and target carousel path
- [ ] Create a migration strategy for moving files into `public/projects/<slug>/carousel/`
- [ ] Update database rows to use the new relative paths if a new field is added
- [ ] Support backward-compatible rendering during the migration window if needed
- [ ] Define rollback behavior if migration fails partway through

## Phase 7: Cleanup behavior and safety

- [ ] Ensure draft screenshot folders are removed when drafts are promoted or deleted
- [ ] Ensure project screenshot deletion does not remove unrelated project files
- [ ] Ensure slug rename behavior does not overwrite existing project files unexpectedly
- [ ] Add safeguards when a target carousel folder already contains files
- [ ] Decide how abandoned draft screenshot folders should be handled

## Phase 8: Automated tests

- [ ] Add service tests for draft screenshot path generation
- [ ] Add service tests for saved screenshot path generation
- [ ] Add tests for promoting draft screenshots into the saved project folder
- [ ] Add tests for deleting screenshots from the carousel folder
- [ ] Add tests for reordering screenshots in the new storage model
- [ ] Add tests for slug rename behavior and file moves
- [ ] Add request or browser tests for admin project screenshot previews
- [ ] Add request or browser tests for homepage carousel rendering with the new URLs
- [ ] Add tests for migration handling of legacy screenshots

## Phase 9: Verification

- [ ] Verify a brand new project can upload draft screenshots before first save
- [ ] Verify saving a new project promotes screenshots into `public/projects/<slug>/carousel/`
- [ ] Verify editing an existing project stores newly uploaded screenshots in the same carousel folder
- [ ] Verify the homepage carousel still rotates correctly
- [ ] Verify admin previews still display correctly
- [ ] Verify deleting screenshots removes only the intended files
- [ ] Verify deleting a project does not remove unrelated project working files
- [ ] Verify old screenshots continue to display after migration

## Suggested implementation order

- [ ] Finalize folder and URL conventions
- [ ] Add the data model support for explicit screenshot paths
- [ ] Refactor the screenshot service
- [ ] Update project service and rendering
- [ ] Add migration support for existing screenshots
- [ ] Add tests around the new workflow
- [ ] Verify manually in create and edit project flows

## Definition of done

- [ ] Project carousel screenshots are no longer stored in `public/uploads/`
- [ ] New screenshot uploads are stored under `public/projects/<slug>/carousel/`
- [ ] Draft screenshots are stored in a dedicated draft project area
- [ ] Admin and public views render project screenshots from the new paths
- [ ] Existing project screenshots can be migrated safely
- [ ] Slug rename behavior keeps carousel assets valid
- [ ] Project deletion does not remove unrelated project working files
- [ ] The new workflow is covered by automated tests

