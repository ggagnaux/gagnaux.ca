const settingsService = require("../services/settingsService");
const packageJson = require("../../package.json");

function attachLocals(req, res, next) {
  res.locals.currentPath = req.path;
  res.locals.currentUser = req.session.user || null;
  res.locals.flashMessage = req.session.flashMessage || null;
  req.session.flashMessage = null;
  res.locals.siteSettings = settingsService.getSettingsObject();
  res.locals.appVersion = packageJson.version || "0.0.0";
  next();
}

module.exports = {
  attachLocals
};


