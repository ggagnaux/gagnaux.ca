const express = require("express");
const publicController = require("../controllers/publicController");

const router = express.Router();

router.get("/", publicController.renderHome);
router.get("/projects", publicController.renderProjects);
router.get("/projects/:slug", publicController.renderProjectDetail);
router.get("/blog", publicController.renderBlog);
router.get("/blog/:slug", publicController.renderPostDetail);
router.get("/about", publicController.renderAbout);
router.get("/contact", publicController.renderContact);

module.exports = router;
