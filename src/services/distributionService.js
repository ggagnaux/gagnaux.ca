const { DateTime } = require("luxon");

const { getDb } = require("../config/database");
const settingsService = require("./settingsService");
const { normalizeText } = require("../utils/formatters");
const { parseJsonSetting } = require("../utils/content");

const ALLOWED_POSTING_MODES = new Set(["manual", "on_first_publish", "on_every_update"]);
const STATUS_LABELS = {
  draft: "Draft",
  ready: "Ready",
  queued: "Queued",
  published: "Published",
  failed: "Failed",
  skipped: "Skipped"
};
const ACTIVE_DESTINATION_KEYS = ["linkedin", "medium", "substack"];
const DESTINATION_ORDER = new Map(ACTIVE_DESTINATION_KEYS.map((key, index) => [key, index]));

function now() {
  return DateTime.now().toISO();
}

function normalizePostingMode(value) {
  return ALLOWED_POSTING_MODES.has(value) ? value : "manual";
}

function isActiveDestinationKey(key) {
  return ACTIVE_DESTINATION_KEYS.includes(key);
}

function sortByDestinationOrder(items) {
  return [...items].sort((left, right) => {
    const leftOrder = DESTINATION_ORDER.has(left.destination_key) ? DESTINATION_ORDER.get(left.destination_key) : 999;
    const rightOrder = DESTINATION_ORDER.has(right.destination_key) ? DESTINATION_ORDER.get(right.destination_key) : 999;

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }

    return Number(left.id || 0) - Number(right.id || 0);
  });
}

function parseDestination(row) {
  const config = parseJsonSetting(row.config_json || "{}", {});
  return {
    ...row,
    is_enabled: Boolean(row.is_enabled),
    posting_mode: normalizePostingMode(row.posting_mode),
    config
  };
}

function listDestinations() {
  const rows = getDb()
    .prepare("SELECT * FROM distribution_destinations")
    .all()
    .map(parseDestination)
    .filter((destination) => isActiveDestinationKey(destination.destination_key));

  return sortByDestinationOrder(rows);
}

function getEnabledDestinations() {
  return listDestinations().filter((destination) => destination.is_enabled);
}

function updateDestinations(input = {}) {
  const database = getDb();
  const timestamp = now();
  const destinations = listDestinations();
  const statement = database.prepare(
    `UPDATE distribution_destinations
     SET is_enabled = ?, posting_mode = ?, config_json = ?, updated_at = ?
     WHERE id = ?`
  );

  destinations.forEach((destination) => {
    const id = String(destination.id);
    const destinationUrl = normalizeText(input[`destination_url_${id}`]);
    const postingMode = normalizePostingMode(input[`posting_mode_${id}`]);
    const isEnabled = input[`enabled_${id}`] ? 1 : 0;
    const nextConfig = {
      ...destination.config,
      destination_url: destinationUrl
    };

    statement.run(isEnabled, postingMode, JSON.stringify(nextConfig), timestamp, destination.id);
  });
}

function getCanonicalBaseUrl() {
  const settings = settingsService.getSettingsObject();
  const siteUrl = normalizeText(settings.site_url || process.env.SITE_URL || "");
  return siteUrl.replace(/\/+$/, "");
}

function buildCanonicalPostUrl(post) {
  if (!post?.slug) {
    return "";
  }

  const baseUrl = getCanonicalBaseUrl();
  const path = `/blog/${post.slug}`;
  return baseUrl ? `${baseUrl}${path}` : path;
}

function buildAssetUrl(pathname) {
  const baseUrl = getCanonicalBaseUrl();
  if (!pathname) {
    return "";
  }

  return baseUrl ? `${baseUrl}${pathname}` : pathname;
}

function stripLineBreaks(value) {
  return normalizeText(String(value || "").replace(/\s+/g, " "));
}

function buildHashtags(tags = []) {
  return tags
    .map((tag) => String(tag || "").replace(/[^a-z0-9]+/gi, " ").trim())
    .map((tag) =>
      tag
        .split(/\s+/)
        .filter(Boolean)
        .map((part, index) => (index === 0 ? part : `${part.charAt(0).toUpperCase()}${part.slice(1)}`))
        .join("")
    )
    .filter(Boolean)
    .slice(0, 4)
    .map((tag) => `#${tag}`);
}

function truncateText(value, maxLength) {
  const normalizedValue = stripLineBreaks(value);
  if (normalizedValue.length <= maxLength) {
    return normalizedValue;
  }

  return `${normalizedValue.slice(0, Math.max(0, maxLength - 1)).trimEnd()}...`;
}

function buildWarnings({ excerpt, canonicalUrl, imageUrl }) {
  const warnings = [];

  if (!excerpt) {
    warnings.push("Add an excerpt to improve the generated preview copy.");
  }

  if (!canonicalUrl) {
    warnings.push("Set the canonical site URL in Settings so generated links use the full public URL.");
  }

  if (!imageUrl) {
    warnings.push("Add a lead image if you want a visual asset for distribution.");
  }

  return warnings;
}

function buildLinkedInPayload(post, context) {
  const { canonicalUrl, excerpt, hashtags } = context;
  const announcement = [
    post.title,
    excerpt,
    hashtags.length ? hashtags.join(" ") : "",
    canonicalUrl
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    destination_type: "announcement_long",
    share_text: announcement,
    short_announcement: truncateText([post.title, excerpt, canonicalUrl].filter(Boolean).join("\n\n"), 300),
    long_announcement: announcement,
    platform_title: post.title,
    platform_subtitle: excerpt,
    platform_body: announcement,
    platform_body_label: "LinkedIn Announcement",
    platform_body_format: "text"
  };
}

function buildMediumPayload(post, context) {
  const { canonicalUrl, excerpt, hashtags } = context;
  const articleBody = post.body_markdown || "";
  const shareText = [post.title, excerpt, canonicalUrl].filter(Boolean).join("\n\n");

  return {
    destination_type: "article_body",
    share_text: shareText,
    short_announcement: truncateText(shareText, 320),
    long_announcement: [post.title, excerpt, canonicalUrl].filter(Boolean).join("\n\n"),
    newsletter_summary: [excerpt, canonicalUrl ? `Read the original post: ${canonicalUrl}` : ""].filter(Boolean).join("\n\n"),
    article_title: post.title,
    article_subtitle: excerpt,
    article_body_markdown: articleBody,
    article_body_html: post.body_html || "",
    canonical_note: canonicalUrl ? `Originally published at ${canonicalUrl}` : "",
    suggested_tags: hashtags,
    platform_title: post.title,
    platform_subtitle: excerpt,
    platform_body: articleBody,
    platform_body_label: "Medium Article Body",
    platform_body_format: "markdown"
  };
}

function buildSubstackPayload(post, context) {
  const { canonicalUrl, excerpt } = context;
  const introBlurb = excerpt || truncateText(post.body_markdown || post.body_html || "", 240);
  const articleBody = post.body_markdown || "";
  const newsletterBody = [
    introBlurb,
    articleBody,
    canonicalUrl ? `Originally published at ${canonicalUrl}` : ""
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    destination_type: "newsletter_body",
    share_text: [post.title, introBlurb, canonicalUrl].filter(Boolean).join("\n\n"),
    short_announcement: truncateText([post.title, introBlurb, canonicalUrl].filter(Boolean).join("\n\n"), 320),
    long_announcement: [post.title, introBlurb, canonicalUrl].filter(Boolean).join("\n\n"),
    newsletter_summary: [introBlurb, canonicalUrl ? `Read the original post: ${canonicalUrl}` : ""].filter(Boolean).join("\n\n"),
    email_subject: post.title,
    intro_blurb: introBlurb,
    article_body_markdown: articleBody,
    article_body_html: post.body_html || "",
    newsletter_body_markdown: newsletterBody,
    canonical_note: canonicalUrl ? `Originally published at ${canonicalUrl}` : "",
    platform_title: post.title,
    platform_subtitle: introBlurb,
    platform_body: newsletterBody,
    platform_body_label: "Substack Newsletter Body",
    platform_body_format: "markdown"
  };
}

function buildPayloadForDestination(post, destination) {
  const canonicalUrl = buildCanonicalPostUrl(post);
  const hashtags = buildHashtags(post.tags || []);
  const excerpt = stripLineBreaks(post.excerpt);
  const imageUrl = post.images?.[0]?.filename ? buildAssetUrl(`/uploads/${post.images[0].filename}`) : "";
  const context = {
    canonicalUrl,
    hashtags,
    excerpt,
    imageUrl,
    warnings: buildWarnings({ excerpt, canonicalUrl, imageUrl })
  };

  const destinationPayloadBuilders = {
    linkedin: buildLinkedInPayload,
    medium: buildMediumPayload,
    substack: buildSubstackPayload
  };
  const platformPayload = (destinationPayloadBuilders[destination.destination_key] || buildLinkedInPayload)(post, context);

  return {
    canonical_url: canonicalUrl,
    destination_key: destination.destination_key,
    destination_label: destination.label,
    destination_type: platformPayload.destination_type,
    destination_url: destination.config.destination_url || "",
    image_url: imageUrl,
    hashtags,
    warnings: context.warnings,
    ...platformPayload
  };
}

function listDistributionAttempts(distributionId, limit = 5) {
  return getDb()
    .prepare(
      "SELECT * FROM distribution_attempts WHERE post_distribution_id = ? ORDER BY created_at DESC, id DESC LIMIT ?"
    )
    .all(distributionId, limit)
    .map((attempt) => ({
      ...attempt,
      request_payload: parseJsonSetting(attempt.request_payload || "{}", {}),
      response_payload: parseJsonSetting(attempt.response_payload || "{}", {})
    }));
}

function recordDistributionAttempt(distributionId, attempt = {}) {
  getDb()
    .prepare(
      `INSERT INTO distribution_attempts
        (post_distribution_id, destination_key, attempt_type, status, request_payload, response_payload, error_message, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      distributionId,
      attempt.destinationKey || "",
      attempt.attemptType || "publish",
      attempt.status || "unknown",
      JSON.stringify(attempt.requestPayload || {}),
      JSON.stringify(attempt.responsePayload || {}),
      attempt.errorMessage || null,
      now()
    );
}

function applyPublishResult(distributionId, result = {}) {
  const timestamp = now();
  const nextStatus = result.ok ? (result.status || "published") : (result.status || "failed");
  const publishedAt = nextStatus === "published" ? timestamp : null;

  getDb()
    .prepare(
      `UPDATE post_distributions
       SET status = ?,
           external_post_id = COALESCE(?, external_post_id),
           external_url = COALESCE(?, external_url),
           last_attempted_at = ?,
           published_at = COALESCE(?, published_at),
           error_message = ?,
           updated_at = ?
       WHERE id = ?`
    )
    .run(
      nextStatus,
      result.externalPostId || null,
      result.externalUrl || null,
      timestamp,
      publishedAt,
      result.ok ? null : (result.errorMessage || result.userMessage || "Publish attempt failed."),
      timestamp,
      distributionId
    );
}

function syncPostDistributions(post) {
  if (!post?.id) {
    return [];
  }

  const database = getDb();
  const timestamp = now();
  const destinations = getEnabledDestinations();
  const existingRows = database.prepare("SELECT * FROM post_distributions WHERE post_id = ?").all(post.id);
  const existingByDestinationId = new Map(existingRows.map((row) => [row.destination_id, row]));
  const upsert = database.prepare(
    `INSERT INTO post_distributions
      (post_id, destination_id, status, payload_json, share_text, external_post_id, external_url, last_attempted_at, published_at, error_message, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(post_id, destination_id) DO UPDATE SET
        status = excluded.status,
        payload_json = excluded.payload_json,
        share_text = excluded.share_text,
        updated_at = excluded.updated_at`
  );

  destinations.forEach((destination) => {
    const existing = existingByDestinationId.get(destination.id);
    const payload = buildPayloadForDestination(post, destination);
    const status = existing?.status === "published"
      ? "published"
      : post.status === "published"
        ? "ready"
        : "draft";

    upsert.run(
      post.id,
      destination.id,
      status,
      JSON.stringify(payload),
      payload.share_text,
      existing?.external_post_id || null,
      existing?.external_url || null,
      existing?.last_attempted_at || null,
      existing?.published_at || null,
      existing?.error_message || null,
      existing?.created_at || timestamp,
      timestamp
    );
  });

  return listPostDistributions(post.id);
}

function hydratePostDistribution(row) {
  const payload = parseJsonSetting(row.payload_json || "{}", {});
  const destination = parseDestination(row);

  return {
    ...destination,
    ...row,
    payload,
    status_label: STATUS_LABELS[row.status] || row.status,
    destination_url: payload.destination_url || destination.config.destination_url || "",
    recent_attempts: listDistributionAttempts(row.id, 3)
  };
}

function getPostDistributionById(id) {
  const row = getDb()
    .prepare(
      `SELECT pd.*, dd.destination_key, dd.label, dd.destination_type, dd.posting_mode, dd.config_json
       FROM post_distributions pd
       INNER JOIN distribution_destinations dd ON dd.id = pd.destination_id
       WHERE pd.id = ?`
    )
    .get(id);

  if (!row || !isActiveDestinationKey(row.destination_key)) {
    return null;
  }

  return hydratePostDistribution(row);
}

function listPostDistributions(postId) {
  const rows = getDb()
    .prepare(
      `SELECT pd.*, dd.destination_key, dd.label, dd.destination_type, dd.posting_mode, dd.config_json
       FROM post_distributions pd
       INNER JOIN distribution_destinations dd ON dd.id = pd.destination_id
       WHERE pd.post_id = ?`
    )
    .all(postId)
    .filter((row) => isActiveDestinationKey(row.destination_key));

  return sortByDestinationOrder(rows.map(hydratePostDistribution));
}

function markDistributionPublished(id) {
  const timestamp = now();
  getDb()
    .prepare(
      `UPDATE post_distributions
       SET status = 'published', published_at = ?, last_attempted_at = ?, error_message = NULL, updated_at = ?
       WHERE id = ?`
    )
    .run(timestamp, timestamp, timestamp, id);
}

function buildPostDistributionSummary(postId) {
  const distributions = listPostDistributions(postId);
  if (distributions.length === 0) {
    return "No destinations";
  }

  const counts = distributions.reduce((map, distribution) => {
    map[distribution.status] = (map[distribution.status] || 0) + 1;
    return map;
  }, {});

  return ["published", "ready", "draft", "failed", "queued", "skipped"]
    .filter((status) => counts[status])
    .map((status) => `${counts[status]} ${status}`)
    .join(" / ");
}

module.exports = {
  listDestinations,
  updateDestinations,
  buildCanonicalPostUrl,
  syncPostDistributions,
  recordDistributionAttempt,
  listDistributionAttempts,
  applyPublishResult,
  getPostDistributionById,
  listPostDistributions,
  markDistributionPublished,
  buildPostDistributionSummary
};


