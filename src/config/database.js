const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");
const bcrypt = require("bcrypt");
const { DateTime } = require("luxon");
const { marked } = require("marked");
const slugify = require("slugify");

const defaultDbDir = path.join(__dirname, "..", "..", "db");
const defaultDbPath = path.join(defaultDbDir, "site.sqlite");
const defaultSchemaPath = path.join(defaultDbDir, "schema.sql");

let db;
let activeDbPath;

function getDbPath() {
  return path.resolve(process.env.DATABASE_PATH || defaultDbPath);
}

function getSchemaPath() {
  return path.resolve(process.env.DATABASE_SCHEMA_PATH || defaultSchemaPath);
}

function getDb() {
  const dbPath = getDbPath();

  if (db && activeDbPath !== dbPath) {
    db.close();
    db = undefined;
    activeDbPath = undefined;
  }

  if (!db) {
    db = new Database(dbPath);
    activeDbPath = dbPath;
    db.pragma("journal_mode = WAL");
  }

  return db;
}

function closeDb() {
  if (db) {
    db.close();
    db = undefined;
    activeDbPath = undefined;
  }
}

function resetDb() {
  closeDb();
}

function ensureDatabase() {
  const dbPath = getDbPath();
  const dbDir = path.dirname(dbPath);

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const database = getDb();
  const schema = fs.readFileSync(getSchemaPath(), "utf8");
  database.exec(schema);
  ensureMediaColumns(database);
  ensureDistributionColumns(database);

  seedSettings(database);
  seedAdmin(database);
  seedProjects(database);
  seedPosts(database);
  seedDistributionDestinations(database);
}

function ensureMediaColumns(database) {
  const columns = database.prepare("PRAGMA table_info(media)").all();
  const columnNames = new Set(columns.map((column) => column.name));

  if (!columnNames.has("storage_path")) {
    database.exec("ALTER TABLE media ADD COLUMN storage_path TEXT");
  }

  if (!columnNames.has("media_role")) {
    database.exec("ALTER TABLE media ADD COLUMN media_role TEXT NOT NULL DEFAULT 'library'");
  }

  if (!columnNames.has("post_id")) {
    database.exec("ALTER TABLE media ADD COLUMN post_id INTEGER");
  }

  if (!columnNames.has("project_id")) {
    database.exec("ALTER TABLE media ADD COLUMN project_id INTEGER");
  }

  if (!columnNames.has("display_order")) {
    database.exec("ALTER TABLE media ADD COLUMN display_order INTEGER NOT NULL DEFAULT 0");
  }
}

function ensureDistributionColumns(database) {
  const destinationColumns = database.prepare("PRAGMA table_info(distribution_destinations)").all();
  if (destinationColumns.length > 0) {
    const destinationColumnNames = new Set(destinationColumns.map((column) => column.name));

    if (!destinationColumnNames.has("config_json")) {
      database.exec("ALTER TABLE distribution_destinations ADD COLUMN config_json TEXT NOT NULL DEFAULT '{}'");
    }
  }

  const postDistributionColumns = database.prepare("PRAGMA table_info(post_distributions)").all();
  if (postDistributionColumns.length > 0) {
    const postDistributionColumnNames = new Set(postDistributionColumns.map((column) => column.name));

    if (!postDistributionColumnNames.has("share_text")) {
      database.exec("ALTER TABLE post_distributions ADD COLUMN share_text TEXT NOT NULL DEFAULT ''");
    }

    if (!postDistributionColumnNames.has("external_post_id")) {
      database.exec("ALTER TABLE post_distributions ADD COLUMN external_post_id TEXT");
    }

    if (!postDistributionColumnNames.has("external_url")) {
      database.exec("ALTER TABLE post_distributions ADD COLUMN external_url TEXT");
    }

    if (!postDistributionColumnNames.has("last_attempted_at")) {
      database.exec("ALTER TABLE post_distributions ADD COLUMN last_attempted_at TEXT");
    }

    if (!postDistributionColumnNames.has("published_at")) {
      database.exec("ALTER TABLE post_distributions ADD COLUMN published_at TEXT");
    }

    if (!postDistributionColumnNames.has("error_message")) {
      database.exec("ALTER TABLE post_distributions ADD COLUMN error_message TEXT");
    }
  }
}

function now() {
  return DateTime.now().toISO();
}

function seedAdmin(database) {
  const existing = database.prepare("SELECT id FROM users LIMIT 1").get();
  if (existing) {
    return;
  }

  const seedUsername = process.env.ADMIN_SEED_USERNAME || "admin";
  const seedPassword = process.env.ADMIN_SEED_PASSWORD || "change-this-admin-password";
  const passwordHash = bcrypt.hashSync(seedPassword, 10);
  database
    .prepare(
      "INSERT INTO users (username, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?)"
    )
    .run(seedUsername, passwordHash, now(), now());
}

function seedSettings(database) {
  const settings = [
    ["site_title", "Greg Gagnaux"],
    ["site_url", "https://gagnaux.ca"],
    ["site_descriptor", "Creative Technologist • Software Engineer • Visual Artist"],
    ["logo_mode", "static"],
    ["logo_animation_mode", "signal"],
    ["logo_anim_background_color", "#000000"],
    ["logo_anim_foreground_color", "#ffffff"],
    ["logo_anim_speed_multiplier", "1"],
    ["logo_anim_line_thickness", "2.4"],
    ["logo_anim_glow_intensity", "0.65"],
    ["logo_signal_trace_speed", "1"],
    ["logo_signal_amplitude", "1"],
    ["logo_signal_grid_enabled", "1"],
    ["logo_signal_grid_opacity", "0.35"],
    ["logo_bars_count", "22"],
    ["logo_bars_speed", "1"],
    ["logo_bars_amplitude", "1"],
    ["logo_bars_bar_width", "3.2"],
    ["logo_radar_sweep_speed", "1"],
    ["logo_radar_trail_length", "12"],
    ["logo_radar_beam_width", "4"],
    ["logo_g_spin_text", "GG"],
    ["logo_g_spin_font_size", "35"],
    ["logo_g_spin_speed", "1"],
    ["logo_dual_font_size", "29"],
    ["logo_dual_change_interval_min", "45"],
    ["logo_dual_change_interval_max", "100"],
    ["logo_dual_allow_vertical_axis", "1"],
    ["logo_dual_allow_horizontal_axis", "1"],
    ["logo_face_color", "#ffffff"],
    ["logo_face_min_visible_frames", "1800"],
    ["logo_face_half_peek_probability", "0.22"],
    ["logo_face_hat_probability", "0.32"],
    ["logo_face_talk_probability", "0.42"],
    ["logo_face_blink_mode_probability", "0.18"],
    ["hero_eyebrow", "PERSONAL WEBSITE / PROJECTS / WRITING / EXPERIMENTS"],
    ["hero_headline", "I build software, visual systems, and creative experiments."],
    [
      "hero_supporting_text",
      "I’m Greg Gagnaux, a software engineer and creative technologist exploring the space between code, design, art, and sound. This site is where I share projects, notes, ideas, and selected work."
    ],
    ["hero_primary_label", "View Projects"],
    ["hero_primary_link", "/projects"],
    ["hero_secondary_label", "Visit Toji Studios"],
    ["hero_secondary_link", "https://toji.studio"],
    ["hero_text_link_label", "Read the Blog"],
    ["hero_text_link", "/blog"],
    [
      "hero_trust_line",
      "Focused on interactive tools, creative coding, UI experiments, and visual thinking."
    ],
    [
      "what_i_do_body",
      "I create digital experiences that blend engineering, visual thinking, and experimentation. My work spans software tools, interface design, creative coding, interactive music ideas, and visual systems built to explore how people engage with information and technology."
    ],
    [
      "elsewhere_links",
      JSON.stringify([
        { label: "Toji Studios", url: "https://toji.studio" },
        { label: "GitHub", url: "https://github.com/" },
        { label: "LinkedIn", url: "https://linkedin.com/" },
        { label: "Medium", url: "https://medium.com/" },
        { label: "Instagram", url: "https://instagram.com/" }
      ])
    ],
    ["footer_copy", "© 2026 Greg Gagnaux. All rights reserved."],
    ["footer_tagline", "Built with curiosity, code, and experimentation."],
    ["about_intro", "Creative technologist, software engineer, and visual artist."],
    [
      "about_body",
      "I work at the intersection of software engineering, visual systems, interaction design, and creative experimentation. I’m interested in how thoughtful interfaces and expressive tools can help people explore ideas more clearly."
    ],
    [
      "contact_body",
      "If you want to talk about software, interfaces, creative tools, or collaboration, reach out."
    ],
    ["contact_email", "hello@gagnaux.ca"]
  ];

  const statement = database.prepare(
    "INSERT OR IGNORE INTO settings (setting_key, setting_value, updated_at) VALUES (?, ?, ?)"
  );

  settings.forEach(([key, value]) => {
    statement.run(key, value, now());
  });
}

function seedDistributionDestinations(database) {
  const timestamp = now();
  const destinations = [
    {
      key: "linkedin",
      label: "LinkedIn",
      type: "announcement_long",
      enabled: 1,
      postingMode: "manual",
      config: { destination_url: "https://www.linkedin.com/feed/" }
    },
    {
      key: "medium",
      label: "Medium",
      type: "article_body",
      enabled: 1,
      postingMode: "manual",
      config: { destination_url: "https://medium.com/" }
    },
    {
      key: "substack",
      label: "Substack",
      type: "newsletter_body",
      enabled: 1,
      postingMode: "manual",
      config: { destination_url: "https://substack.com/" }
    }
  ];

  const statement = database.prepare(
    "INSERT OR IGNORE INTO distribution_destinations (destination_key, label, destination_type, is_enabled, posting_mode, config_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  );

  destinations.forEach((destination) => {
    statement.run(
      destination.key,
      destination.label,
      destination.type,
      destination.enabled,
      destination.postingMode,
      JSON.stringify(destination.config),
      timestamp,
      timestamp
    );
  });

  const normalizations = [
    { key: "linkedin", label: "LinkedIn", destinationUrl: "https://www.linkedin.com/feed/" },
    { key: "medium", label: "Medium", destinationUrl: "https://medium.com/" },
    { key: "substack", label: "Substack", destinationUrl: "https://substack.com/" }
  ];

  normalizations.forEach(({ key, label, destinationUrl }) => {
    const row = database
      .prepare("SELECT id, label, config_json FROM distribution_destinations WHERE destination_key = ?")
      .get(key);

    if (!row) {
      return;
    }

    const parsedConfig = JSON.parse(row.config_json || "{}");
    const nextConfig = {
      ...parsedConfig,
      destination_url: parsedConfig.destination_url || destinationUrl
    };

    if (row.label !== label || JSON.stringify(parsedConfig) !== JSON.stringify(nextConfig)) {
      database
        .prepare(
          "UPDATE distribution_destinations SET label = ?, config_json = ?, updated_at = ? WHERE destination_key = ?"
        )
        .run(label, JSON.stringify(nextConfig), timestamp, key);
    }
  });
}

function seedProjects(database) {
  const existing = database.prepare("SELECT COUNT(*) AS count FROM projects").get();
  if (existing.count > 0) {
    return;
  }

  const projects = [
    {
      title: "EP-133 Simulator",
      projectType: "Music Tool",
      summary:
        "A browser-based simulation inspired by the Teenage Engineering EP-133 workflow and interface.",
      description:
        "## EP-133 Simulator\n\nA browser-based simulation inspired by the Teenage Engineering EP-133 workflow and interface.\n\n- Interaction-first design\n- Hardware-inspired controls\n- Built for playful experimentation",
      externalUrl: null,
      internalUrl: "/projects/ep-133-simulator",
      isFeatured: 1,
      order: 1
    },
    {
      title: "Musical Scale Visualizer",
      projectType: "Music Theory",
      summary:
        "An interactive way to explore scales, keys, and playable note relationships through visual feedback.",
      description:
        "## Musical Scale Visualizer\n\nAn interactive way to explore scales, keys, and playable note relationships through visual feedback.\n\nThis project focuses on making abstract music theory more legible through visual structure.",
      externalUrl: null,
      internalUrl: "/projects/musical-scale-visualizer",
      isFeatured: 1,
      order: 2
    },
    {
      title: "Toji Studios",
      projectType: "Art / Portfolio",
      summary:
        "My visual art portfolio and creative identity system, featuring selected digital work and design experiments.",
      description:
        "## Toji Studios\n\nA visual art portfolio and identity system for selected digital work, design experiments, and exploratory image-making.",
      externalUrl: "https://toji.studio",
      internalUrl: null,
      isFeatured: 1,
      order: 3
    },
    {
      title: "Periodic Table",
      projectType: "Data / UI Experiment",
      summary:
        "A web-based interface experiment that explores structured information through layout, interaction, and visual hierarchy.",
      description:
        "## Periodic Table\n\nA web-based interface experiment exploring structured information through layout, interaction, and visual hierarchy.",
      externalUrl: null,
      internalUrl: "/projects/periodic-table",
      isFeatured: 1,
      order: 4
    }
  ];

  const statement = database.prepare(
    `INSERT INTO projects
      (title, slug, summary, description_markdown, description_html, project_type, external_url, internal_url, is_featured, display_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  projects.forEach((project) => {
    const timestamp = now();
    statement.run(
      project.title,
      slugify(project.title, { lower: true, strict: true }),
      project.summary,
      project.description,
      marked.parse(project.description),
      project.projectType,
      project.externalUrl,
      project.internalUrl,
      project.isFeatured,
      project.order,
      timestamp,
      timestamp
    );
  });
}

function seedPosts(database) {
  const existing = database.prepare("SELECT COUNT(*) AS count FROM posts").get();
  if (existing.count > 0) {
    return;
  }

  const posts = [
    {
      title: "Building at the intersection of code, art, and sound",
      excerpt:
        "Why the most interesting tools often live between software engineering, visual systems, and creative play.",
      body:
        "## Building at the intersection of code, art, and sound\n\nThis site is a place to collect projects, notes, and experiments that sit between software, interface design, art, and sound.\n\nI’m interested in tools that make abstract ideas easier to see, hear, and manipulate.",
      tags: ["creative coding", "process"],
      featured: 1,
      status: "published"
    },
    {
      title: "Notes from interface experiments and creative tooling",
      excerpt:
        "A running set of observations on interaction design, feedback systems, and building with intent.",
      body:
        "## Notes from interface experiments and creative tooling\n\nI like building interfaces that help people understand complex systems through interaction and visual structure.\n\nThis post sketches the principles that keep showing up in that work.",
      tags: ["ui", "experiments"],
      featured: 1,
      status: "published"
    },
    {
      title: "What I’m learning while building in public",
      excerpt:
        "Publishing work early changes how you think about polish, clarity, and iteration.",
      body:
        "## What I’m learning while building in public\n\nSharing in-progress work creates useful pressure. It forces clarity, sharper decisions, and a better sense of what actually matters to other people.",
      tags: ["writing", "practice"],
      featured: 0,
      status: "draft"
    }
  ];

  const postStatement = database.prepare(
    `INSERT INTO posts
      (title, slug, excerpt, body_markdown, body_html, status, is_featured, published_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const tagStatement = database.prepare("INSERT INTO post_tags (post_id, tag) VALUES (?, ?)");

  posts.forEach((post) => {
    const timestamp = now();
    const result = postStatement.run(
      post.title,
      slugify(post.title, { lower: true, strict: true }),
      post.excerpt,
      post.body,
      marked.parse(post.body),
      post.status,
      post.featured,
      post.status === "published" ? timestamp : null,
      timestamp,
      timestamp
    );

    post.tags.forEach((tag) => {
      tagStatement.run(result.lastInsertRowid, tag);
    });
  });
}

module.exports = {
  ensureDatabase,
  getDb,
  getDbPath,
  closeDb,
  resetDb
};




