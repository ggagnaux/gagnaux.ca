const { marked } = require("marked");
const slugify = require("slugify");

function renderMarkdown(markdown) {
  return marked.parse(markdown || "");
}

function createSlug(value) {
  return slugify(value || "", { lower: true, strict: true });
}

function parseJsonSetting(value, fallback) {
  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

module.exports = {
  renderMarkdown,
  createSlug,
  parseJsonSetting
};
