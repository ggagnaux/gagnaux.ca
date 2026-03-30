# Deployment Workflow

This app does not have a frontend compilation step. The production build creates a clean deployable bundle for the Express server, Nunjucks views, public assets, and database schema. As part of that build, client-side JavaScript in `build/public/` is minified by default.

## Commands

- `npm run build`
  Creates a deployable bundle in `build/` and minifies client-side JavaScript.

- `npm run build -- --skip-minify-js`
  Creates the bundle without minifying client-side JavaScript.

- `npm run deploy -- --target <directory>`
  Copies the bundle into the target directory, installs production dependencies there, initializes the SQLite database, and includes minified client-side JavaScript by default.

- `npm run deploy -- --target <directory> --skip-minify-js`
  Runs the deployment flow but skips JavaScript minification during the build step.

## Notes

- Set `SESSION_SECRET` in the deployed `.env` before starting the app.
- The build excludes `db/site.sqlite` and uploaded files under `public/uploads/` so existing server data is not bundled from your local machine.
- The deploy step is additive and overwrite-based for managed files; it does not delete extra files already present in the target directory.
- To test the deploy copy without reinstalling packages, use `npm run deploy -- --target <directory> --skip-install`.
