const settingsService = require("./settingsService");

const AUTHORIZATION_URL = "https://www.linkedin.com/oauth/v2/authorization";
const ACCESS_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";
const DEFAULT_SCOPES = ["w_member_social"];

function getScopeList() {
  return String(process.env.LINKEDIN_SCOPES || DEFAULT_SCOPES.join(" "))
    .split(/\s+/)
    .map((scope) => scope.trim())
    .filter(Boolean);
}

function buildOrigin(req) {
  const proto = req.headers["x-forwarded-proto"] || req.protocol || "http";
  const host = req.get("host");
  return `${proto}://${host}`;
}

function getRedirectUri(req) {
  return process.env.LINKEDIN_REDIRECT_URI || `${buildOrigin(req)}/admin/settings/linkedin/callback`;
}

function getConfig(req) {
  const clientId = String(process.env.LINKEDIN_CLIENT_ID || "").trim();
  const clientSecret = String(process.env.LINKEDIN_CLIENT_SECRET || "").trim();
  const scopes = getScopeList();
  const redirectUri = getRedirectUri(req);

  return {
    clientId,
    clientSecret,
    scopes,
    redirectUri,
    isConfigured: Boolean(clientId && clientSecret && redirectUri)
  };
}

function buildAuthorizationUrl(req, state) {
  const config = getConfig(req);
  const params = new URLSearchParams({
    response_type: "code",
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    state,
    scope: config.scopes.join(" ")
  });

  return `${AUTHORIZATION_URL}?${params.toString()}`;
}

async function exchangeCodeForToken(req, code) {
  const config = getConfig(req);
  const response = await fetch(ACCESS_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri
    })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error_description || payload.error || "Failed to exchange LinkedIn authorization code for an access token.");
  }

  return payload;
}

function saveConnection(tokenPayload) {
  const issuedAt = Date.now();
  const expiresAt = tokenPayload.expires_in
    ? new Date(issuedAt + Number(tokenPayload.expires_in) * 1000).toISOString()
    : "";
  const refreshExpiresAt = tokenPayload.refresh_token_expires_in
    ? new Date(issuedAt + Number(tokenPayload.refresh_token_expires_in) * 1000).toISOString()
    : "";

  settingsService.upsertSettings({
    linkedin_access_token: tokenPayload.access_token || "",
    linkedin_refresh_token: tokenPayload.refresh_token || "",
    linkedin_token_expires_at: expiresAt,
    linkedin_refresh_token_expires_at: refreshExpiresAt,
    linkedin_scope: tokenPayload.scope || getScopeList().join(" "),
    linkedin_member_id: "",
    linkedin_member_name: "",
    linkedin_member_email: "",
    linkedin_author_urn: "",
    linkedin_connected_at: new Date().toISOString(),
    linkedin_profile_url: ""
  });
}

function clearConnection() {
  settingsService.upsertSettings({
    linkedin_access_token: "",
    linkedin_refresh_token: "",
    linkedin_token_expires_at: "",
    linkedin_refresh_token_expires_at: "",
    linkedin_scope: "",
    linkedin_member_id: "",
    linkedin_member_name: "",
    linkedin_member_email: "",
    linkedin_author_urn: "",
    linkedin_connected_at: "",
    linkedin_profile_url: ""
  });
}

function getAuthStatus(req) {
  const settings = settingsService.getSettingsObject();
  const config = getConfig(req);

  return {
    isConfigured: config.isConfigured,
    isConnected: Boolean(settings.linkedin_access_token),
    isReadyToPublish: false,
    clientIdConfigured: Boolean(config.clientId),
    clientSecretConfigured: Boolean(config.clientSecret),
    redirectUri: config.redirectUri,
    scopes: config.scopes,
    memberId: settings.linkedin_member_id || "",
    memberName: settings.linkedin_member_name || "",
    memberEmail: settings.linkedin_member_email || "",
    authorUrn: settings.linkedin_author_urn || "",
    profileUrl: settings.linkedin_profile_url || "",
    connectedAt: settings.linkedin_connected_at || "",
    tokenExpiresAt: settings.linkedin_token_expires_at || ""
  };
}

module.exports = {
  AUTHORIZATION_URL,
  getConfig,
  getAuthStatus,
  buildAuthorizationUrl,
  exchangeCodeForToken,
  saveConnection,
  clearConnection
};
