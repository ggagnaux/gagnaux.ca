import express from "express";
import session from "express-session";
import multer from "multer";
import path from "node:path";
import fs from "node:fs/promises";
import { existsSync, mkdirSync } from "node:fs";
import matter from "gray-matter";
import { marked } from "marked";
import slugify from "slugify";

const app = express();
const PORT = Number(process.env.PORT || 3000);

const ROOT = process.cwd();
const POSTS_DIR = path.join(ROOT, "content", "posts");
const UPLOADS_DIR = path.join(ROOT, "public", "uploads");
const CONFIG_PATH = path.join(ROOT, "content", "config.json");

if (!existsSync(POSTS_DIR)) mkdirSync(POSTS_DIR, { recursive: true });
if (!existsSync(UPLOADS_DIR)) mkdirSync(UPLOADS_DIR, { recursive: true });

const DEFAULT_CONFIG = {
  siteTitle: "gagnaux.ca",
  tagline: "Work highlights, writing, and links.",
  about: "This is a minimal personal site for sharing projects, notes, and links.",
  highlights: [
    "Shipped practical web projects.",
    "Focused on clean UI and maintainable code.",
    "Published concise technical notes."
  ],
  links: [
    { label: "GitHub", url: "https://github.com/" },
    { label: "LinkedIn", url: "https://www.linkedin.com/" },
    { label: "Your other website", url: "https://example.com/" }
  ]
};

marked.setOptions({ breaks: true, gfm: true });

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    name: "gagnaux.sid",
    secret: process.env.SESSION_SECRET || "change-this-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 1000 * 60 * 60 * 12
    }
  })
);

app.use(express.static(path.join(ROOT, "public")));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, extension);
    const safeBase = slugify(base, { lower: true, strict: true }) || "image";
    cb(null, `${Date.now()}-${safeBase}${extension}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.mimetype);
    cb(ok ? null : new Error("Only image uploads are allowed."), ok);
  }
});

function ensureAuth(req, res, next) {
  if (req.session?.authenticated) return next();
  return res.status(401).json({ error: "Unauthorized" });
}

function toSlug(input) {
  return slugify(input || "", { lower: true, strict: true, trim: true });
}

function postPathFromSlug(slug) {
  return path.join(POSTS_DIR, `${slug}.md`);
}

function normalizeConfig(input) {
  const cfg = typeof input === "object" && input ? input : {};
  const highlights = Array.isArray(cfg.highlights)
    ? cfg.highlights.map((item) => String(item).trim()).filter(Boolean)
    : DEFAULT_CONFIG.highlights;
  const links = Array.isArray(cfg.links)
    ? cfg.links
        .filter((item) => item && typeof item === "object")
        .map((item) => ({
          label: String(item.label || "").trim(),
          url: String(item.url || "").trim()
        }))
        .filter((item) => item.label && item.url)
    : DEFAULT_CONFIG.links;

  return {
    siteTitle: String(cfg.siteTitle || DEFAULT_CONFIG.siteTitle).trim(),
    tagline: String(cfg.tagline || DEFAULT_CONFIG.tagline).trim(),
    about: String(cfg.about || DEFAULT_CONFIG.about).trim(),
    highlights,
    links
  };
}

async function readConfig() {
  if (!existsSync(CONFIG_PATH)) {
    await fs.writeFile(CONFIG_PATH, `${JSON.stringify(DEFAULT_CONFIG, null, 2)}\n`, "utf-8");
    return DEFAULT_CONFIG;
  }

  try {
    const raw = await fs.readFile(CONFIG_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    return normalizeConfig(parsed);
  } catch {
    return DEFAULT_CONFIG;
  }
}

async function writeConfig(config) {
  const normalized = normalizeConfig(config);
  await fs.writeFile(CONFIG_PATH, `${JSON.stringify(normalized, null, 2)}\n`, "utf-8");
  return normalized;
}

async function readPostFile(filePath) {
  const raw = await fs.readFile(filePath, "utf-8");
  const parsed = matter(raw);
  const filenameSlug = path.basename(filePath, ".md");
  const data = parsed.data || {};
  const dateValue = typeof data.date === "string" ? data.date : new Date().toISOString().slice(0, 10);

  return {
    slug: typeof data.slug === "string" ? data.slug : filenameSlug,
    title: typeof data.title === "string" ? data.title : filenameSlug,
    summary: typeof data.summary === "string" ? data.summary : "",
    date: dateValue,
    tags: Array.isArray(data.tags) ? data.tags : [],
    draft: Boolean(data.draft),
    coverImage: typeof data.coverImage === "string" ? data.coverImage : "",
    content: parsed.content.trim(),
    html: marked.parse(parsed.content)
  };
}

async function readAllPosts() {
  const files = await fs.readdir(POSTS_DIR);
  const mdFiles = files.filter((file) => file.endsWith(".md"));
  const posts = await Promise.all(mdFiles.map((file) => readPostFile(path.join(POSTS_DIR, file))));
  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return posts;
}

function validatePostInput(payload) {
  const title = String(payload.title || "").trim();
  const slug = toSlug(String(payload.slug || title));
  const summary = String(payload.summary || "").trim();
  const content = String(payload.content || "").trim();
  const date = String(payload.date || new Date().toISOString().slice(0, 10)).trim();
  const draft = payload.draft === true || payload.draft === "true";
  const coverImage = String(payload.coverImage || "").trim();
  const tags = String(payload.tags || "").split(",").map((tag) => tag.trim()).filter(Boolean);

  if (!title) return { error: "Title is required." };
  if (!slug) return { error: "Slug is required." };
  if (!content) return { error: "Content is required." };

  return { title, slug, summary, content, date, draft, coverImage, tags };
}

function buildMarkdown(post) {
  const frontmatter = {
    title: post.title,
    slug: post.slug,
    date: post.date,
    summary: post.summary,
    tags: post.tags,
    draft: post.draft,
    coverImage: post.coverImage
  };

  return matter.stringify(`${post.content}\n`, frontmatter);
}

app.post("/api/admin/login", (req, res) => {
  const username = String(req.body.username || "");
  const password = String(req.body.password || "");
  const expectedUser = process.env.ADMIN_USER || "admin";
  const expectedPass = process.env.ADMIN_PASS || "admin123";

  if (username === expectedUser && password === expectedPass) {
    req.session.authenticated = true;
    return res.json({ ok: true });
  }

  return res.status(401).json({ error: "Invalid credentials." });
});

app.post("/api/admin/logout", ensureAuth, (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get("/api/admin/session", (req, res) => {
  res.json({ authenticated: Boolean(req.session?.authenticated) });
});

app.get("/api/config", async (_req, res) => {
  const config = await readConfig();
  res.json(config);
});

app.get("/api/admin/config", ensureAuth, async (_req, res) => {
  const config = await readConfig();
  res.json(config);
});

app.put("/api/admin/config", ensureAuth, async (req, res) => {
  const saved = await writeConfig(req.body);
  res.json({ ok: true, config: saved });
});

app.get("/api/posts", async (req, res) => {
  const includeDrafts = req.query.includeDrafts === "true" && req.session?.authenticated;
  const posts = await readAllPosts();
  const visible = includeDrafts ? posts : posts.filter((post) => !post.draft);

  res.json(
    visible.map((post) => ({
      slug: post.slug,
      title: post.title,
      summary: post.summary,
      date: post.date,
      tags: post.tags,
      draft: post.draft,
      coverImage: post.coverImage
    }))
  );
});

app.get("/api/posts/:slug", async (req, res) => {
  const slug = toSlug(req.params.slug);
  const filePath = postPathFromSlug(slug);
  if (!existsSync(filePath)) return res.status(404).json({ error: "Post not found." });

  const post = await readPostFile(filePath);
  if (post.draft && !req.session?.authenticated) return res.status(404).json({ error: "Post not found." });

  return res.json(post);
});

app.get("/api/admin/posts", ensureAuth, async (_req, res) => {
  const posts = await readAllPosts();
  res.json(posts);
});

app.post("/api/admin/posts", ensureAuth, async (req, res) => {
  const parsed = validatePostInput(req.body);
  if (parsed.error) return res.status(400).json({ error: parsed.error });

  const target = postPathFromSlug(parsed.slug);
  if (existsSync(target)) return res.status(409).json({ error: "Slug already exists." });

  await fs.writeFile(target, buildMarkdown(parsed), "utf-8");
  return res.status(201).json({ ok: true, slug: parsed.slug });
});

app.put("/api/admin/posts/:slug", ensureAuth, async (req, res) => {
  const currentSlug = toSlug(req.params.slug);
  const parsed = validatePostInput(req.body);
  if (parsed.error) return res.status(400).json({ error: parsed.error });

  const currentPath = postPathFromSlug(currentSlug);
  if (!existsSync(currentPath)) return res.status(404).json({ error: "Post not found." });

  const nextPath = postPathFromSlug(parsed.slug);
  if (parsed.slug !== currentSlug && existsSync(nextPath)) {
    return res.status(409).json({ error: "Target slug already exists." });
  }

  await fs.writeFile(nextPath, buildMarkdown(parsed), "utf-8");
  if (nextPath !== currentPath && existsSync(currentPath)) await fs.unlink(currentPath);

  return res.json({ ok: true, slug: parsed.slug });
});

app.delete("/api/admin/posts/:slug", ensureAuth, async (req, res) => {
  const slug = toSlug(req.params.slug);
  const target = postPathFromSlug(slug);
  if (!existsSync(target)) return res.status(404).json({ error: "Post not found." });

  await fs.unlink(target);
  return res.json({ ok: true });
});

app.post("/api/admin/upload", ensureAuth, upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No image uploaded." });

  return res.json({
    ok: true,
    url: `/uploads/${req.file.filename}`,
    markdown: `![alt text](/uploads/${req.file.filename})`
  });
});

app.use((err, _req, res, _next) => {
  const message = err && err.message ? err.message : "Unexpected server error.";
  res.status(500).json({ error: message });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  if (!process.env.ADMIN_USER || !process.env.ADMIN_PASS) {
    console.log("Using default admin credentials: admin / admin123");
  }
});
