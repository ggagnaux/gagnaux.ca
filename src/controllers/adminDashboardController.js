const dashboardService = require("../services/dashboardService");
const settingsService = require("../services/settingsService");

function renderDashboard(req, res) {
  res.render("admin/dashboard", {
    pageTitle: "Dashboard",
    stats: dashboardService.getDashboardStats(),
    settings: settingsService.getSettingsObject()
  });
}

module.exports = {
  renderDashboard
};
