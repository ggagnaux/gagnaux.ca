# Build And Deploy

This document describes the simplified deployment workflow for `www.gagnaux.ca`.

The deployment model is:

- build on the local computer
- copy the production-ready files to the VPS
- run the app directly from `~/htdocs/www.gagnaux.ca/`

## CloudPanel Setup

Create a new site in CloudPanel:

1. Go to `Sites`
2. Click `+ Add Site`
3. Choose `Node.js Site`
4. Use these values:
   - `Primary Domain`: `www.gagnaux.ca`
   - `Node.js Version`: `22`
   - `App Port`: `3000`

If you also want `gagnaux.ca`, add it as a domain alias or redirect it to `www.gagnaux.ca`.

## One-Time Server Setup

SSH into the server as the CloudPanel site user and create the target folder:<br/>
Note: When creating the Node site in CloudPanel, the folder `www.gagnaux.ca` is automatically created in the `htdocs` folder

```bash
mkdir -p ~/htdocs/www.gagnaux.ca
cd ~/htdocs/www.gagnaux.ca
```

Create the production environment file on the server:

```bash
nano ~/htdocs/www.gagnaux.ca/.env
```

Example:

```env
PORT=3000
SESSION_SECRET=replace-this-with-a-long-random-secret
NODE_ENV=production
ADMIN_SEED_USERNAME=youradmin
ADMIN_SEED_PASSWORD=replace-this-with-a-strong-password
```

## Local Build

From the project root on the local machine:

```bash
npm install
npm run build
cd build
npm ci --omit=dev
```

This produces a deployable runtime in the local `build/` folder.

## What To Upload

Upload the contents of local `build/` directly into:

```text
~/htdocs/www.gagnaux.ca/
```

This includes:

- `server.js`
- `package.json`
- `package-lock.json`
- `node_modules/`
- `src/`
- `views/`
- `public/`
- `scripts/`
- `db/`

## Files To Preserve On The Server

Do not overwrite these during deployment:

- `.env`
- `db/site.sqlite`
- `public/uploads/`

These contain:

- production environment settings
- the live SQLite database
- uploaded media

## First Start

Install PM2 once on the server:

```bash
npm install -g pm2
```

Start the app from the deployment folder:

```bash
cd ~/htdocs/www.gagnaux.ca
pm2 start npm --name gagnaux-ca -- start
pm2 save
```

## Future Deployments

For each new deployment:

### On the local machine

```bash
npm install
npm run build
cd build
npm ci --omit=dev
```

### Upload to the server

Copy the contents of local `build/` into:

```text
~/htdocs/www.gagnaux.ca/
```

Preserve:

- `.env`
- `db/site.sqlite`
- `public/uploads/`

### Recommended rsync command

Use `rsync` to copy the local `build/` output directly to the server while preserving the remote environment file, database, and uploaded media:

```bash
rsync -av --delete \
  --exclude ".env" \
  --exclude "db/site.sqlite" \
  --exclude "public/uploads/" \
  build/ your-cloudpanel-user@your-server:~/htdocs/www.gagnaux.ca/
```

Replace:

- `your-cloudpanel-user` with the CloudPanel site user
- `your-server` with the VPS hostname or IP address

### Restart the app

```bash
cd ~/htdocs/www.gagnaux.ca
pm2 restart gagnaux-ca
```

You can also restart the app in one command after syncing:

```bash
ssh your-cloudpanel-user@your-server "cd ~/htdocs/www.gagnaux.ca && pm2 restart gagnaux-ca"
```

## First-Run Admin Seed

On first startup, the app initializes the database automatically if needed.

If the `users` table is empty, the app seeds the admin account using:

- `ADMIN_SEED_USERNAME`
- `ADMIN_SEED_PASSWORD`

After the database already exists, changing those values will not update the existing admin user automatically.

## Recommended Resulting Server Layout

After deployment, the server folder should look roughly like:

```text
~/htdocs/www.gagnaux.ca/
  .env
  server.js
  package.json
  package-lock.json
  node_modules/
  src/
  views/
  scripts/
  public/
  db/
```

With these persisted:

- `db/site.sqlite`
- `public/uploads/`

## SSL

In CloudPanel:

1. Point DNS for `www.gagnaux.ca` to the VPS
2. Open the site in CloudPanel
3. Issue and install the Let's Encrypt certificate

## Quick Summary

### Local

```bash
npm install
npm run build
cd build
npm ci --omit=dev
```

### Remote

- upload local `build/` contents to `~/htdocs/www.gagnaux.ca/`
- preserve `.env`, database, and uploads
- restart PM2:

```bash
cd ~/htdocs/www.gagnaux.ca
pm2 restart gagnaux-ca
```
