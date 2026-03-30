function publish(distribution) {
  return {
    ok: false,
    status: "failed",
    attemptStatus: "manual_required",
    userMessage: "Substack direct publishing is not available for this app yet. Use the prepared newsletter body to publish manually.",
    errorMessage: "Substack direct publishing is unavailable here. Use the generated export content for manual publishing.",
    requestSummary: {
      destination: distribution.destination_key,
      mode: "manual_export",
      email_subject: distribution.payload.email_subject || ""
    },
    responseSummary: {
      reason: "substack_manual_export_required"
    }
  };
}

module.exports = {
  publish
};
