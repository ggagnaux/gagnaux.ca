const { DateTime } = require("luxon");

function formatDisplayDate(value) {
  if (!value) {
    return "";
  }

  return DateTime.fromISO(value).toLocaleString(DateTime.DATE_MED);
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

module.exports = {
  formatDisplayDate,
  normalizeText
};
