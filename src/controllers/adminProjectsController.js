const { randomUUID } = require("crypto");
const projectService = require("../services/projectService");
const screenshotService = require("../services/projectScreenshotService");
const mediaService = require("../services/mediaService");

function getActiveProjectTab(value) {
  return value === "images" ? "images" : "details";
}

function getUploadSessionId(value) {
  return value || randomUUID();
}

function rewriteDraftAssetPaths(markdown, mappings) {
  let nextMarkdown = markdown || "";
  mappings.forEach(({ from, to }) => {
    if (from && to) {
      nextMarkdown = nextMarkdown.replaceAll(from, to);
    }
  });
  return nextMarkdown;
}

function getProjectFormMeta(project = null) {
  const featuredProjectCount = projectService.countFeaturedProjects(project?.id || null);
  const featuredProjectLimit = projectService.FEATURED_PROJECT_LIMIT;
  const canSetFeatured = featuredProjectCount < featuredProjectLimit;

  return {
    featuredProjectLimit,
    featuredProjectCount,
    canSetFeatured,
    featuredLimitReached: !canSetFeatured && !(project && project.is_featured)
  };
}

function renderProjects(req, res) {
  const projects = projectService.listProjects().map((project) => ({
    ...project,
    canToggleFeaturedOn: project.is_featured || projectService.canFeatureProject(project.id)
  }));

  res.render("admin/projects/index", {
    pageTitle: "Projects",
    featuredProjectLimit: projectService.FEATURED_PROJECT_LIMIT,
    projects
  });
}

function renderNewProject(req, res) {
  const uploadSessionId = getUploadSessionId(req.query.upload_session_id);
  res.render("admin/projects/form", {
    pageTitle: "New Project",
    formTitle: "Create Project",
    project: null,
    activeProjectTab: getActiveProjectTab(req.query.tab),
    uploadSessionId,
    draftProjectScreenshots: screenshotService.listDraftProjectScreenshots(uploadSessionId),
    mediaLibraryItems: mediaService.listMedia(),
    ...getProjectFormMeta()
  });
}

function renderEditProject(req, res) {
  const project = projectService.getProjectById(req.params.id);
  if (!project) {
    return res.redirect("/admin/projects");
  }

  return res.render("admin/projects/form", {
    pageTitle: "Edit Project",
    formTitle: "Edit Project",
    project,
    activeProjectTab: getActiveProjectTab(req.query.tab),
    uploadSessionId: null,
    draftProjectScreenshots: [],
    mediaLibraryItems: mediaService.listMedia(),
    ...getProjectFormMeta(project)
  });
}

async function createProject(req, res, next) {
  try {
    const activeProjectTab = getActiveProjectTab(req.body.active_project_tab);
    const uploadSessionId = getUploadSessionId(req.body.upload_session_id);
    if (req.body.is_featured && !projectService.canFeatureProject()) {
      req.session.flashMessage = `A maximum of ${projectService.FEATURED_PROJECT_LIMIT} projects can be featured on the homepage.`;
      return res.redirect(`/admin/projects/new?tab=${encodeURIComponent(activeProjectTab)}&upload_session_id=${encodeURIComponent(uploadSessionId)}`);
    }

    let project = projectService.saveProject(req.body);
    await screenshotService.saveProjectScreenshots(project, req.files?.screenshots);
    const mappings = screenshotService.promoteDraftProjectScreenshots(uploadSessionId, project);

    if (mappings.length > 0) {
      project = projectService.saveProject({
        ...req.body,
        description_markdown: rewriteDraftAssetPaths(req.body.description_markdown || "", mappings)
      }, project.id);
    }

    req.session.flashMessage = `Saved project "${project.title}".`;
    res.redirect(`/admin/projects/${project.id}/edit?tab=${encodeURIComponent(activeProjectTab)}`);
  } catch (error) {
    next(error);
  }
}

async function updateProject(req, res, next) {
  try {
    const activeProjectTab = getActiveProjectTab(req.body.active_project_tab);
    if (req.body.is_featured && !projectService.canFeatureProject(req.params.id)) {
      req.session.flashMessage = `A maximum of ${projectService.FEATURED_PROJECT_LIMIT} projects can be featured on the homepage.`;
      return res.redirect(`/admin/projects/${req.params.id}/edit?tab=${encodeURIComponent(activeProjectTab)}`);
    }

    const project = projectService.saveProject(req.body, req.params.id);
    req.session.flashMessage = `Updated project "${project.title}".`;
    res.redirect(`/admin/projects/${project.id}/edit?tab=${encodeURIComponent(activeProjectTab)}`);
  } catch (error) {
    next(error);
  }
}

async function uploadDraftProjectScreenshots(req, res, next) {
  try {
    const uploadSessionId = getUploadSessionId(req.body.upload_session_id);
    await screenshotService.saveDraftProjectScreenshots(uploadSessionId, req.files?.screenshots);
    req.session.flashMessage = "Added draft project screenshots.";
    return res.redirect(`/admin/projects/new?tab=images&upload_session_id=${encodeURIComponent(uploadSessionId)}`);
  } catch (error) {
    return next(error);
  }
}

function deleteSelectedDraftProjectScreenshots(req, res, next) {
  try {
    const uploadSessionId = getUploadSessionId(req.body.upload_session_id);
    const screenshotIds = Array.isArray(req.body.screenshotIds)
      ? req.body.screenshotIds
      : req.body.screenshotIds ? [req.body.screenshotIds] : [];
    const deleted = screenshotService.deleteDraftProjectScreenshotsByIds(uploadSessionId, screenshotIds);

    if (deleted) {
      req.session.flashMessage = "Removed selected draft screenshots.";
    }

    return res.redirect(`/admin/projects/new?tab=images&upload_session_id=${encodeURIComponent(uploadSessionId)}`);
  } catch (error) {
    return next(error);
  }
}

async function uploadProjectScreenshots(req, res, next) {
  try {
    const project = projectService.getProjectById(req.params.id);
    if (!project) {
      return res.redirect("/admin/projects");
    }

    await screenshotService.saveProjectScreenshots(project, req.files?.screenshots);
    req.session.flashMessage = `Updated screenshots for "${project.title}".`;
    return res.redirect(`/admin/projects/${project.id}/edit?tab=images`);
  } catch (error) {
    return next(error);
  }
}

function deleteProjectScreenshot(req, res, next) {
  try {
    const project = projectService.getProjectById(req.params.id);
    if (!project) {
      return res.redirect("/admin/projects");
    }

    screenshotService.deleteProjectScreenshot(project.id, req.params.screenshotId, project.slug);
    req.session.flashMessage = `Removed a screenshot from "${project.title}".`;
    return res.redirect(`/admin/projects/${project.id}/edit?tab=images`);
  } catch (error) {
    return next(error);
  }
}

function deleteSelectedProjectScreenshots(req, res, next) {
  try {
    const project = projectService.getProjectById(req.params.id);
    if (!project) {
      return res.redirect("/admin/projects");
    }

    const screenshotIds = Array.isArray(req.body.screenshotIds)
      ? req.body.screenshotIds
      : req.body.screenshotIds ? [req.body.screenshotIds] : [];
    const deleted = screenshotService.deleteProjectScreenshotsByIds(project.id, screenshotIds, project.slug);

    if (deleted) {
      req.session.flashMessage = `Removed selected screenshots from "${project.title}".`;
    }

    return res.redirect(`/admin/projects/${project.id}/edit?tab=images`);
  } catch (error) {
    return next(error);
  }
}

function reorderProjectScreenshots(req, res, next) {
  try {
    const project = projectService.getProjectById(req.params.id);
    if (!project) {
      return res.status(404).json({ ok: false, error: "Project not found." });
    }

    const screenshotIds = Array.isArray(req.body.screenshotIds)
      ? req.body.screenshotIds.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0)
      : [];

    if (screenshotIds.length === 0) {
      return res.status(400).json({ ok: false, error: "No screenshot order provided." });
    }

    const reordered = screenshotService.reorderProjectScreenshots(project.id, screenshotIds, project.slug);
    if (!reordered) {
      return res.status(400).json({ ok: false, error: "Unable to reorder screenshots." });
    }

    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
}

function moveProjectScreenshot(req, res, next) {
  try {
    const project = projectService.getProjectById(req.params.id);
    if (!project) {
      return res.redirect("/admin/projects");
    }

    const direction = req.body.direction === "left" ? "left" : "right";
    screenshotService.moveProjectScreenshot(project.id, req.params.screenshotId, project.slug, direction);
    return res.redirect(`/admin/projects/${project.id}/edit?tab=images`);
  } catch (error) {
    return next(error);
  }
}

function deleteProject(req, res, next) {
  try {
    const project = projectService.getProjectById(req.params.id);
    if (!project) {
      return res.redirect("/admin/projects");
    }

    const deleteProjectFolder = req.body.delete_project_folder === "1";
    projectService.deleteProject(project.id, { deleteProjectFolder });
    req.session.flashMessage = deleteProjectFolder
      ? `Project "${project.title}" and its project folder were deleted.`
      : `Project "${project.title}" was deleted and its carousel assets were removed.`;
    return res.redirect("/admin/projects");
  } catch (error) {
    return next(error);
  }
}

function toggleProjectFeatured(req, res, next) {
  try {
    const project = projectService.getProjectById(req.params.id);
    if (!project) {
      return res.redirect("/admin/projects");
    }

    const nextFeatured = !project.is_featured;
    if (nextFeatured && !projectService.canFeatureProject(project.id)) {
      req.session.flashMessage = `A maximum of ${projectService.FEATURED_PROJECT_LIMIT} projects can be featured on the homepage.`;
      return res.redirect("/admin/projects");
    }

    const updatedProject = projectService.setProjectFeatured(project.id, nextFeatured);
    req.session.flashMessage = updatedProject?.is_featured
      ? `Featured project "${project.title}" on the homepage.`
      : `Removed project "${project.title}" from the homepage featured list.`;
    return res.redirect("/admin/projects");
  } catch (error) {
    return next(error);
  }
}

function reorderProjects(req, res) {
  const projectIds = Array.isArray(req.body.projectIds)
    ? req.body.projectIds.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0)
    : [];

  if (projectIds.length === 0) {
    return res.status(400).json({ ok: false, error: "No project order provided." });
  }

  projectService.reorderProjects(projectIds);
  return res.json({ ok: true });
}

module.exports = {
  renderProjects,
  renderNewProject,
  renderEditProject,
  createProject,
  updateProject,
  uploadDraftProjectScreenshots,
  deleteSelectedDraftProjectScreenshots,
  uploadProjectScreenshots,
  deleteProjectScreenshot,
  deleteSelectedProjectScreenshots,
  reorderProjectScreenshots,
  moveProjectScreenshot,
  deleteProject,
  toggleProjectFeatured,
  reorderProjects
};



