# Minimal Blog (HTML/CSS/JS + Markdown)

This project uses:

- Frontend: plain HTML/CSS/JS in `public/`
- Backend: Node + Express in `server.js`
- Posts: markdown files in `content/posts/`
- Site settings: `content/config.json`
- Images: uploaded to `public/uploads/`

## Features

- Public blog list and post pages
- Admin login
- Create/Edit/Delete posts from the web app
- Draft support (`draft: true` hides post from public listing)
- Image upload from admin and markdown insertion
- Editable homepage config from the admin panel

## Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Admin login

Set these environment variables in production:

- `ADMIN_USER`
- `ADMIN_PASS`
- `SESSION_SECRET`

If not set, local defaults are used:

- username: `admin`
- password: `admin123`

## Post format

```md
---
title: My Post
slug: my-post
date: 2026-02-27
summary: Short summary
tags:
  - web
  - notes
draft: false
coverImage: /uploads/example.jpg
---

Markdown content here.
```
