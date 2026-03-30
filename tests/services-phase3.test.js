const test = require("node:test");
const assert = require("node:assert/strict");

const { createTestAppContext } = require("../test-support/test-app");

let context;
let originalFetch;

test.before(() => {
  context = createTestAppContext();
  originalFetch = global.fetch;
});

test.after(() => {
  global.fetch = originalFetch;
  context.cleanup();
});

test.afterEach(() => {
  global.fetch = originalFetch;
});

test("linkedin auth config and authorization URL use environment settings", () => {
  process.env.LINKEDIN_CLIENT_ID = "linkedin-client-id";
  process.env.LINKEDIN_CLIENT_SECRET = "linkedin-client-secret";
  delete process.env.LINKEDIN_REDIRECT_URI;
  process.env.LINKEDIN_SCOPES = "w_member_social r_liteprofile";

  const linkedinAuthService = require("../src/services/linkedinAuthService");
  const requestLike = {
    protocol: "https",
    headers: {},
    get(name) {
      return name === "host" ? "example.com" : undefined;
    }
  };

  const config = linkedinAuthService.getConfig(requestLike);
  const authorizationUrl = new URL(linkedinAuthService.buildAuthorizationUrl(requestLike, "test-state"));

  assert.equal(config.clientId, "linkedin-client-id");
  assert.equal(config.clientSecret, "linkedin-client-secret");
  assert.equal(config.redirectUri, "https://example.com/admin/settings/linkedin/callback");
  assert.deepEqual(config.scopes, ["w_member_social", "r_liteprofile"]);
  assert.equal(config.isConfigured, true);

  assert.equal(authorizationUrl.origin + authorizationUrl.pathname, linkedinAuthService.AUTHORIZATION_URL);
  assert.equal(authorizationUrl.searchParams.get("response_type"), "code");
  assert.equal(authorizationUrl.searchParams.get("client_id"), "linkedin-client-id");
  assert.equal(authorizationUrl.searchParams.get("redirect_uri"), config.redirectUri);
  assert.equal(authorizationUrl.searchParams.get("state"), "test-state");
  assert.equal(authorizationUrl.searchParams.get("scope"), "w_member_social r_liteprofile");
});

test("exchangeCodeForToken posts to LinkedIn and returns the token payload", async () => {
  process.env.LINKEDIN_CLIENT_ID = "linkedin-client-id";
  process.env.LINKEDIN_CLIENT_SECRET = "linkedin-client-secret";
  process.env.LINKEDIN_REDIRECT_URI = "https://example.com/custom-callback";

  const linkedinAuthService = require("../src/services/linkedinAuthService");
  const requestLike = {
    protocol: "https",
    headers: {},
    get() {
      return "example.com";
    }
  };

  let capturedRequest;
  global.fetch = async (url, options) => {
    capturedRequest = { url, options };
    return {
      ok: true,
      async json() {
        return {
          access_token: "access-token",
          expires_in: 3600,
          scope: "w_member_social"
        };
      }
    };
  };

  const payload = await linkedinAuthService.exchangeCodeForToken(requestLike, "auth-code-123");
  const body = capturedRequest.options.body.toString();

  assert.equal(capturedRequest.url, "https://www.linkedin.com/oauth/v2/accessToken");
  assert.equal(capturedRequest.options.method, "POST");
  assert.match(body, /grant_type=authorization_code/);
  assert.match(body, /code=auth-code-123/);
  assert.match(body, /client_id=linkedin-client-id/);
  assert.match(body, /client_secret=linkedin-client-secret/);
  assert.match(body, /redirect_uri=https%3A%2F%2Fexample.com%2Fcustom-callback/);
  assert.equal(payload.access_token, "access-token");
});

test("exchangeCodeForToken surfaces LinkedIn error messages", async () => {
  process.env.LINKEDIN_CLIENT_ID = "linkedin-client-id";
  process.env.LINKEDIN_CLIENT_SECRET = "linkedin-client-secret";

  const linkedinAuthService = require("../src/services/linkedinAuthService");
  const requestLike = {
    protocol: "https",
    headers: {},
    get() {
      return "example.com";
    }
  };

  global.fetch = async () => ({
    ok: false,
    async json() {
      return {
        error_description: "Authorization code expired"
      };
    }
  });

  await assert.rejects(
    () => linkedinAuthService.exchangeCodeForToken(requestLike, "expired-code"),
    /Authorization code expired/
  );
});

test("saveConnection and clearConnection update LinkedIn auth status in settings", () => {
  process.env.LINKEDIN_CLIENT_ID = "linkedin-client-id";
  process.env.LINKEDIN_CLIENT_SECRET = "linkedin-client-secret";

  const linkedinAuthService = require("../src/services/linkedinAuthService");
  const requestLike = {
    protocol: "https",
    headers: {},
    get() {
      return "example.com";
    }
  };

  linkedinAuthService.saveConnection({
    access_token: "saved-access-token",
    refresh_token: "saved-refresh-token",
    expires_in: 3600,
    refresh_token_expires_in: 7200,
    scope: "w_member_social"
  });

  const connectedStatus = linkedinAuthService.getAuthStatus(requestLike);
  assert.equal(connectedStatus.isConfigured, true);
  assert.equal(connectedStatus.isConnected, true);
  assert.equal(connectedStatus.scopes[0], "w_member_social");
  assert.equal(connectedStatus.tokenExpiresAt.length > 0, true);
  assert.equal(connectedStatus.connectedAt.length > 0, true);

  linkedinAuthService.clearConnection();

  const clearedStatus = linkedinAuthService.getAuthStatus(requestLike);
  assert.equal(clearedStatus.isConnected, false);
  assert.equal(clearedStatus.connectedAt, "");
  assert.equal(clearedStatus.tokenExpiresAt, "");
});

test("distribution sync prepares enabled destinations and publish state transitions", () => {
  const postService = require("../src/services/postService");
  const settingsService = require("../src/services/settingsService");
  const distributionService = require("../src/services/distributionService");

  settingsService.upsertSettings({
    site_url: "https://example.com/"
  });

  const post = postService.listPosts({ includeDrafts: false })[0];
  const distributions = distributionService.syncPostDistributions(post);

  assert.equal(distributions.length, 3);
  assert.deepEqual(
    distributions.map((distribution) => distribution.destination_key),
    ["linkedin", "medium", "substack"]
  );
  assert.ok(distributions.every((distribution) => distribution.status === "ready"));

  const linkedinDistribution = distributions.find((distribution) => distribution.destination_key === "linkedin");
  assert.equal(linkedinDistribution.payload.canonical_url, `https://example.com/blog/${post.slug}`);
  assert.equal(linkedinDistribution.payload.destination_url, "https://www.linkedin.com/feed/");
  assert.match(linkedinDistribution.payload.share_text, new RegExp(post.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(linkedinDistribution.payload.share_text, /https:\/\/example.com\/blog\//);
  const expectedHashtags = post.tags.map((tag) => {
    const cleanedTag = String(tag || "").replace(/[^a-z0-9]+/gi, " ").trim();
    const camelCasedTag = cleanedTag
      .split(/\s+/)
      .filter(Boolean)
      .map((part, index) => (index === 0 ? part : `${part.charAt(0).toUpperCase()}${part.slice(1)}`))
      .join("");

    return `#${camelCasedTag}`;
  });

  assert.deepEqual(linkedinDistribution.payload.hashtags, expectedHashtags);
  assert.match(linkedinDistribution.payload.warnings.join(" "), /lead image/i);

  distributionService.recordDistributionAttempt(linkedinDistribution.id, {
    destinationKey: linkedinDistribution.destination_key,
    status: "success",
    requestPayload: { body: "payload" },
    responsePayload: { id: "abc123" }
  });

  distributionService.applyPublishResult(linkedinDistribution.id, {
    ok: true,
    externalPostId: "abc123",
    externalUrl: "https://www.linkedin.com/feed/update/abc123"
  });

  const updatedDistribution = distributionService.getPostDistributionById(linkedinDistribution.id);
  assert.equal(updatedDistribution.status, "published");
  assert.equal(updatedDistribution.external_post_id, "abc123");
  assert.equal(updatedDistribution.external_url, "https://www.linkedin.com/feed/update/abc123");
  assert.equal(updatedDistribution.recent_attempts.length, 1);
  assert.deepEqual(updatedDistribution.recent_attempts[0].request_payload, { body: "payload" });
  assert.equal(distributionService.buildPostDistributionSummary(post.id), "1 published / 2 ready");
});

