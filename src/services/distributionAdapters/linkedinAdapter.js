const settingsService = require("../settingsService");

async function publish(distribution) {
  const settings = settingsService.getSettingsObject();
  const accessToken = settings.linkedin_access_token || "";
  const errors = [];

  if (!distribution.destination_url) {
    errors.push("Add a LinkedIn profile or page URL in Settings / Distribution before publishing.");
  }

  if (!accessToken) {
    errors.push("Connect LinkedIn in Settings / Distribution before using Publish Now.");
  }

  if (errors.length > 0) {
    return {
      ok: false,
      status: "failed",
      attemptStatus: "blocked",
      userMessage: errors[errors.length - 1],
      errorMessage: errors.join(" "),
      requestSummary: {
        destination: distribution.destination_key,
        mode: "native_api",
        share_text_length: (distribution.payload.share_text || "").length
      },
      responseSummary: {
        reason: "linkedin_not_ready"
      }
    };
  }

  return {
    ok: false,
    status: "failed",
    attemptStatus: "blocked",
    userMessage: "Native LinkedIn publishing is not available for this app yet. Use the generated copy for manual posting.",
    errorMessage: "LinkedIn member posting requires an author-identification path that is not available for this app configuration.",
    requestSummary: {
      destination: distribution.destination_key,
      mode: "native_api",
      share_text_length: (distribution.payload.share_text || "").length
    },
    responseSummary: {
      reason: "linkedin_native_posting_unavailable"
    }
  };
}

module.exports = {
  publish
};
