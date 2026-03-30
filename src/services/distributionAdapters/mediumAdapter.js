function publish(distribution) {
  const canonicalUrl = distribution.payload.canonical_url || "";

  return {
    ok: false,
    status: "failed",
    attemptStatus: "manual_required",
    userMessage: "Medium direct publishing is not available for this app yet. Use the prepared article body and canonical note to publish manually.",
    errorMessage: "Medium direct publishing is unavailable here. Use the generated export content for manual publishing.",
    requestSummary: {
      destination: distribution.destination_key,
      mode: "manual_export",
      canonical_url: canonicalUrl,
      article_title: distribution.payload.article_title || distribution.label
    },
    responseSummary: {
      reason: "medium_manual_export_required",
      canonical_url: canonicalUrl
    }
  };
}

module.exports = {
  publish
};
