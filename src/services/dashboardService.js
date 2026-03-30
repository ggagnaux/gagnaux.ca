const { DASHBOARD_RECENT_POSTS_LIMIT } = require("../config/constants");
const { getDb } = require("../config/database");

function getDashboardStats() {
  const database = getDb();
  return {
    posts: database.prepare("SELECT COUNT(*) AS count FROM posts").get().count,
    publishedPosts: database
      .prepare("SELECT COUNT(*) AS count FROM posts WHERE status = 'published'")
      .get().count,
    draftPosts: database.prepare("SELECT COUNT(*) AS count FROM posts WHERE status = 'draft'").get().count,
    projects: database.prepare("SELECT COUNT(*) AS count FROM projects").get().count,
    recentPosts: database
      .prepare(`SELECT id, title, status, is_featured, updated_at FROM posts ORDER BY updated_at DESC LIMIT ${DASHBOARD_RECENT_POSTS_LIMIT}`)
      .all()
  };
}

module.exports = {
  getDashboardStats
};
