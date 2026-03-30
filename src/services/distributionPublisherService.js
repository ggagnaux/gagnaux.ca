const linkedinAdapter = require("./distributionAdapters/linkedinAdapter");
const mediumAdapter = require("./distributionAdapters/mediumAdapter");
const substackAdapter = require("./distributionAdapters/substackAdapter");
const distributionService = require("./distributionService");

const ADAPTERS = {
  linkedin: linkedinAdapter,
  medium: mediumAdapter,
  substack: substackAdapter
};

function getAdapter(destinationKey) {
  return ADAPTERS[destinationKey] || null;
}

async function publishDistribution(distribution) {
  const adapter = getAdapter(distribution.destination_key);

  if (!adapter || typeof adapter.publish !== "function") {
    const result = {
      ok: false,
      status: "failed",
      attemptStatus: "blocked",
      userMessage: `No publishing adapter is available for ${distribution.label}.`,
      errorMessage: `No publishing adapter is available for ${distribution.destination_key}.`,
      requestSummary: {
        destination: distribution.destination_key,
        mode: "none"
      },
      responseSummary: {
        reason: "missing_adapter"
      }
    };
    distributionService.recordDistributionAttempt(distribution.id, {
      destinationKey: distribution.destination_key,
      attemptType: "publish",
      status: result.attemptStatus,
      requestPayload: result.requestSummary,
      responsePayload: result.responseSummary,
      errorMessage: result.errorMessage
    });
    distributionService.applyPublishResult(distribution.id, result);
    return result;
  }

  const result = await adapter.publish(distribution);
  distributionService.recordDistributionAttempt(distribution.id, {
    destinationKey: distribution.destination_key,
    attemptType: "publish",
    status: result.attemptStatus || (result.ok ? "success" : "failed"),
    requestPayload: result.requestSummary,
    responsePayload: result.responseSummary,
    errorMessage: result.errorMessage || null
  });
  distributionService.applyPublishResult(distribution.id, result);
  return result;
}

module.exports = {
  publishDistribution
};
