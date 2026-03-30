const { FEATURED_PROJECT_LIMIT, HOME_FEATURED_POSTS_LIMIT } = require("../config/constants");
const postService = require("../services/postService");
const projectService = require("../services/projectService");
const settingsService = require("../services/settingsService");

function renderHome(req, res) {
  res.render("public/home", {
    pageTitle: "Home",
    featuredProjects: projectService.getFeaturedProjects(FEATURED_PROJECT_LIMIT),
    featuredPosts: postService.getFeaturedPosts(HOME_FEATURED_POSTS_LIMIT),
    settings: settingsService.getSettingsObject(),
    skillPills: [
      "Software Engineering",
      "Creative Coding",
      "UI / UX Design",
      "Visual Systems",
      "Interactive Experiments"
    ]
  });
}

function renderProjects(req, res) {
  res.render("public/projects/index", {
    pageTitle: "Projects",
    projects: projectService.listProjects()
  });
}

function renderProjectDetail(req, res) {
  const project = projectService.getProjectBySlug(req.params.slug);
  if (!project) {
    return res.status(404).render("public/404", { pageTitle: "Project Not Found" });
  }

  return res.render("public/projects/detail", {
    pageTitle: project.title,
    project
  });
}

function renderBlog(req, res) {
  res.render("public/blog/index", {
    pageTitle: "Blog",
    posts: postService.listPosts({ includeDrafts: false })
  });
}

function renderPostDetail(req, res) {
  const post = postService.getPostBySlug(req.params.slug);
  if (!post) {
    return res.status(404).render("public/404", { pageTitle: "Post Not Found" });
  }

  return res.render("public/blog/detail", {
    pageTitle: post.title,
    post
  });
}

function renderAbout(req, res) {
  res.render("public/about", {
    pageTitle: "About"
  });
}

function renderContact(req, res) {
  res.render("public/contact", {
    pageTitle: "Contact"
  });
}

module.exports = {
  renderHome,
  renderProjects,
  renderProjectDetail,
  renderBlog,
  renderPostDetail,
  renderAbout,
  renderContact
};
