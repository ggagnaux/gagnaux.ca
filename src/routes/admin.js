const express = require("express");
const authController = require("../controllers/adminAuthController");
const dashboardController = require("../controllers/adminDashboardController");
const postsController = require("../controllers/adminPostsController");
const projectsController = require("../controllers/adminProjectsController");
const securityController = require("../controllers/adminSecurityController");
const settingsController = require("../controllers/adminSettingsController");
const mediaController = require("../controllers/adminMediaController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/login", authController.renderLogin);
router.post("/login", authController.login);
router.post("/logout", authController.logout);

router.use(requireAuth);

router.get("/", dashboardController.renderDashboard);

router.get("/posts", postsController.renderPosts);
router.get("/posts/new", postsController.renderNewPost);
router.post("/posts", postsController.createPost);
router.post("/posts/draft-images", postsController.uploadDraftPostImages);
router.post("/posts/draft-images/delete-selected", postsController.deleteSelectedDraftPostImages);
router.get("/posts/:id/edit", postsController.renderEditPost);
router.post("/posts/:id", postsController.updatePost);
router.post("/posts/:id/images", postsController.uploadPostImages);
router.post("/posts/:id/images/delete-selected", postsController.deleteSelectedPostImages);
router.post("/posts/:id/distributions/:distributionId/publish", postsController.publishDistribution);
router.post("/posts/:id/distributions/:distributionId/mark-published", postsController.markDistributionPublished);
router.post("/posts/:id/delete", postsController.deletePost);

router.get("/projects", projectsController.renderProjects);
router.post("/projects/reorder", projectsController.reorderProjects);
router.post("/projects/:id/toggle-featured", projectsController.toggleProjectFeatured);
router.get("/projects/new", projectsController.renderNewProject);
router.post("/projects", projectsController.createProject);
router.post("/projects/draft-screenshots", projectsController.uploadDraftProjectScreenshots);
router.post("/projects/draft-screenshots/delete-selected", projectsController.deleteSelectedDraftProjectScreenshots);
router.get("/projects/:id/edit", projectsController.renderEditProject);
router.post("/projects/:id", projectsController.updateProject);
router.post("/projects/:id/screenshots", projectsController.uploadProjectScreenshots);
router.post("/projects/:id/screenshots/delete-selected", projectsController.deleteSelectedProjectScreenshots);
router.post("/projects/:id/screenshots/reorder", projectsController.reorderProjectScreenshots);
router.post("/projects/:id/screenshots/:screenshotId/delete", projectsController.deleteProjectScreenshot);
router.post("/projects/:id/screenshots/:screenshotId/move", projectsController.moveProjectScreenshot);
router.post("/projects/:id/delete", projectsController.deleteProject);

router.get("/security", securityController.renderSecurity);
router.post("/security", securityController.updateSecurity);

router.get("/settings", settingsController.renderSettings);
router.post("/settings", settingsController.updateSettings);
router.get("/settings/linkedin/connect", settingsController.connectLinkedIn);
router.get("/settings/linkedin/callback", settingsController.handleLinkedInCallback);
router.post("/settings/linkedin/disconnect", settingsController.disconnectLinkedIn);

router.get("/media", mediaController.renderMedia);
router.post("/media/upload", mediaController.uploadMedia);
router.post("/media/delete-selected", mediaController.deleteSelectedMedia);
router.post("/media/:id/delete", mediaController.deleteMedia);

module.exports = router;


