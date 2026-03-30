const mediaService = require("../services/mediaService");

function getActiveMediaTab(value) {
  return value === "new" ? "new" : "existing";
}

function buildDeleteFlashMessage(result, forceReferenced = false) {
  const deletedCount = result.deleted.length;
  const blockedCount = result.blocked.length;

  if (deletedCount === 0 && blockedCount === 0) {
    return null;
  }

  if (blockedCount === 0) {
    if (forceReferenced) {
      return deletedCount === 1
        ? "Deleted 1 media item, including any selected in-use media."
        : `Deleted ${deletedCount} media items, including any selected in-use media.`;
    }

    return deletedCount === 1 ? "Deleted 1 media item." : `Deleted ${deletedCount} media items.`;
  }

  const blockedNames = result.blocked.map((item) => item.original_name).join(", ");
  if (deletedCount === 0) {
    return `Deletion blocked for referenced media: ${blockedNames}.`;
  }

  return `Deleted ${deletedCount} media item${deletedCount === 1 ? "" : "s"}. Skipped referenced media: ${blockedNames}.`;
}

function renderMedia(req, res) {
  res.render("admin/media/index", {
    pageTitle: "Media",
    mediaItems: mediaService.listMedia(),
    activeMediaTab: getActiveMediaTab(req.query.tab)
  });
}

function uploadMedia(req, res) {
  if (req.files && req.files.media) {
    mediaService.saveUpload(req.files.media, req.body.alt_text || "");
    req.session.flashMessage = "Media uploaded.";
  }

  res.redirect("/admin/media?tab=new");
}

function deleteMedia(req, res) {
  const result = mediaService.deleteMedia(req.params.id);
  const flashMessage = buildDeleteFlashMessage(result);
  if (flashMessage) {
    req.session.flashMessage = flashMessage;
  }
  res.redirect("/admin/media?tab=existing");
}

function deleteSelectedMedia(req, res) {
  const mediaIds = Array.isArray(req.body.mediaIds)
    ? req.body.mediaIds
    : req.body.mediaIds ? [req.body.mediaIds] : [];
  const forceReferenced = req.body.allow_in_use_delete === "1";
  const result = mediaService.deleteMediaByIds(mediaIds, { forceReferenced });
  const flashMessage = buildDeleteFlashMessage(result, forceReferenced);
  if (flashMessage) {
    req.session.flashMessage = flashMessage;
  }
  res.redirect("/admin/media?tab=existing");
}

module.exports = {
  renderMedia,
  uploadMedia,
  deleteMedia,
  deleteSelectedMedia
};
