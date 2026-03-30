const { randomUUID } = require("crypto");
const distributionService = require("../services/distributionService");
const distributionPublisherService = require("../services/distributionPublisherService");
const postService = require("../services/postService");
const postImageService = require("../services/postImageService");
const mediaService = require("../services/mediaService");

function getActivePostTab(value) {
  return ["details", "images", "distribution"].includes(value) ? value : "details";
}

function getUploadSessionId(value) {
  return value || randomUUID();
}

function rewriteDraftAssetPaths(markdown, mappings) {
  let nextMarkdown = markdown || "";
  mappings.forEach(({ from, to }) => {
    nextMarkdown = nextMarkdown.replaceAll(`/uploads/${from}`, `/uploads/${to}`);
  });
  return nextMarkdown;
}

function syncDistributionsForPost(post) {
  try {
    if (post?.id) {
      distributionService.syncPostDistributions(postService.getPostById(post.id));
    }
  } catch (error) {
    console.error("Failed to sync post distributions", error);
  }
}

function renderPosts(req, res) {
  const posts = postService.listPosts().map((post) => ({
    ...post,
    distribution_summary: distributionService.buildPostDistributionSummary(post.id)
  }));

  res.render("admin/posts/index", {
    pageTitle: "Posts",
    posts
  });
}

function renderNewPost(req, res) {
  const uploadSessionId = getUploadSessionId(req.query.upload_session_id);
  const draftPostImages = postImageService.listDraftPostImages(uploadSessionId);

  res.render("admin/posts/form", {
    pageTitle: "New Post",
    formTitle: "Create Post",
    post: null,
    activePostTab: getActivePostTab(req.query.tab),
    uploadSessionId,
    draftPostImages,
    postDistributions: [],
    mediaLibraryItems: mediaService.listMedia()
  });
}

function renderEditPost(req, res) {
  const post = postService.getPostById(req.params.id);
  if (!post) {
    return res.redirect("/admin/posts");
  }

  syncDistributionsForPost(post);

  return res.render("admin/posts/form", {
    pageTitle: "Edit Post",
    formTitle: "Edit Post",
    post,
    activePostTab: getActivePostTab(req.query.tab),
    uploadSessionId: null,
    draftPostImages: [],
    postDistributions: distributionService.listPostDistributions(post.id),
    mediaLibraryItems: mediaService.listMedia()
  });
}

async function createPost(req, res, next) {
  try {
    const activePostTab = getActivePostTab(req.body.active_post_tab);
    const uploadSessionId = getUploadSessionId(req.body.upload_session_id);
    let post = postService.savePost(req.body);
    await postImageService.savePostImages(post, req.files?.images);
    const mappings = postImageService.promoteDraftPostImages(uploadSessionId, post);

    if (mappings.length > 0) {
      post = postService.savePost({
        ...req.body,
        body_markdown: rewriteDraftAssetPaths(req.body.body_markdown || "", mappings)
      }, post.id);
    }

    syncDistributionsForPost(post);
    req.session.flashMessage = `Saved post "${post.title}".`;
    res.redirect(`/admin/posts/${post.id}/edit?tab=${encodeURIComponent(activePostTab)}`);
  } catch (error) {
    next(error);
  }
}

async function updatePost(req, res, next) {
  try {
    const activePostTab = getActivePostTab(req.body.active_post_tab);
    const post = postService.savePost(req.body, req.params.id);
    await postImageService.savePostImages(post, req.files?.images);
    syncDistributionsForPost(post);
    req.session.flashMessage = `Updated post "${post.title}".`;
    res.redirect(`/admin/posts/${post.id}/edit?tab=${encodeURIComponent(activePostTab)}`);
  } catch (error) {
    next(error);
  }
}

async function uploadDraftPostImages(req, res, next) {
  try {
    const uploadSessionId = getUploadSessionId(req.body.upload_session_id);
    await postImageService.saveDraftPostImages(uploadSessionId, req.files?.images);
    req.session.flashMessage = "Added draft post images.";
    return res.redirect(`/admin/posts/new?tab=images&upload_session_id=${encodeURIComponent(uploadSessionId)}`);
  } catch (error) {
    return next(error);
  }
}

function deleteSelectedDraftPostImages(req, res, next) {
  try {
    const uploadSessionId = getUploadSessionId(req.body.upload_session_id);
    const imageIds = Array.isArray(req.body.imageIds)
      ? req.body.imageIds
      : req.body.imageIds ? [req.body.imageIds] : [];
    const deleted = postImageService.deleteDraftPostImagesByIds(uploadSessionId, imageIds);

    if (deleted) {
      req.session.flashMessage = "Removed selected draft images.";
    }

    return res.redirect(`/admin/posts/new?tab=images&upload_session_id=${encodeURIComponent(uploadSessionId)}`);
  } catch (error) {
    return next(error);
  }
}

async function uploadPostImages(req, res, next) {
  try {
    const post = postService.getPostById(req.params.id);
    if (!post) {
      return res.redirect("/admin/posts");
    }

    await postImageService.savePostImages(post, req.files?.images);
    syncDistributionsForPost(post);
    req.session.flashMessage = `Updated images for "${post.title}".`;
    return res.redirect(`/admin/posts/${post.id}/edit?tab=images`);
  } catch (error) {
    return next(error);
  }
}

function deleteSelectedPostImages(req, res, next) {
  try {
    const post = postService.getPostById(req.params.id);
    if (!post) {
      return res.redirect("/admin/posts");
    }

    const imageIds = Array.isArray(req.body.imageIds)
      ? req.body.imageIds
      : req.body.imageIds ? [req.body.imageIds] : [];
    const deleted = postImageService.deletePostImagesByIds(post.id, imageIds, post.slug);

    if (deleted) {
      syncDistributionsForPost(post);
      req.session.flashMessage = `Removed selected images from "${post.title}".`;
    }

    return res.redirect(`/admin/posts/${post.id}/edit?tab=images`);
  } catch (error) {
    return next(error);
  }
}

async function publishDistribution(req, res, next) {
  const post = postService.getPostById(req.params.id);
  if (!post) {
    return res.redirect("/admin/posts");
  }

  const distribution = distributionService.getPostDistributionById(req.params.distributionId);
  if (!distribution || Number(distribution.post_id) !== Number(post.id)) {
    req.session.flashMessage = "Distribution record not found.";
    return res.redirect(`/admin/posts/${post.id}/edit?tab=distribution`);
  }

  try {
    const result = await distributionPublisherService.publishDistribution(distribution);
    req.session.flashMessage = result.userMessage || `Publish attempt finished for ${distribution.label}.`;
    return res.redirect(`/admin/posts/${post.id}/edit?tab=distribution`);
  } catch (error) {
    return next(error);
  }
}

function markDistributionPublished(req, res) {
  const post = postService.getPostById(req.params.id);
  if (!post) {
    return res.redirect("/admin/posts");
  }

  const distribution = distributionService.getPostDistributionById(req.params.distributionId);
  if (!distribution || Number(distribution.post_id) !== Number(post.id)) {
    req.session.flashMessage = "Distribution record not found.";
    return res.redirect(`/admin/posts/${post.id}/edit?tab=distribution`);
  }

  distributionService.markDistributionPublished(req.params.distributionId);
  req.session.flashMessage = `Marked ${distribution.label} for "${post.title}" as published.`;
  return res.redirect(`/admin/posts/${post.id}/edit?tab=distribution`);
}

function deletePost(req, res) {
  postService.deletePost(req.params.id);
  req.session.flashMessage = "Post deleted.";
  res.redirect("/admin/posts");
}

module.exports = {
  renderPosts,
  renderNewPost,
  renderEditPost,
  createPost,
  updatePost,
  uploadDraftPostImages,
  deleteSelectedDraftPostImages,
  uploadPostImages,
  deleteSelectedPostImages,
  publishDistribution,
  markDistributionPublished,
  deletePost
};


