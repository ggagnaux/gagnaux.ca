document.documentElement.classList.add("js");

const THEME_STORAGE_KEY = "gagnaux-theme";
const DEFAULT_THEME = "drift";
const themeOptions = Array.from(document.querySelectorAll("[data-theme-option]"));
const themeCurrentLabels = Array.from(document.querySelectorAll("[data-theme-current]"));
const themeSummaries = Array.from(document.querySelectorAll("[data-theme-summary]"));

function formatThemeName(theme) {
  return theme.charAt(0).toUpperCase() + theme.slice(1);
}

function applyTheme(theme) {
  const selectedTheme = themeOptions.some((option) => option.dataset.themeValue === theme)
    ? theme
    : DEFAULT_THEME;

  document.documentElement.dataset.theme = selectedTheme;

  themeOptions.forEach((option) => {
    const isActive = option.dataset.themeValue === selectedTheme;
    option.classList.toggle("is-active", isActive);
    option.setAttribute("aria-pressed", String(isActive));
  });

  themeCurrentLabels.forEach((label) => {
    label.textContent = formatThemeName(selectedTheme);
  });

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, selectedTheme);
  } catch (error) {
    // Ignore storage failures and keep the current theme active.
  }
}

function getInitialTheme() {
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY) || DEFAULT_THEME;
  } catch (error) {
    return DEFAULT_THEME;
  }
}

themeOptions.forEach((option) => {
  option.addEventListener("click", () => {
    applyTheme(option.dataset.themeValue);
  });
});

themeSummaries.forEach((summary) => {
  summary.addEventListener("focus", () => {
    summary.setAttribute("aria-expanded", "true");
  });

  summary.addEventListener("blur", () => {
    summary.setAttribute("aria-expanded", "false");
  });
});

applyTheme(getInitialTheme());

const colorPickerFields = Array.from(document.querySelectorAll("[data-color-picker]"));

function getContrastColor(hex) {
  const normalized = (hex || "").replace("#", "");
  if (normalized.length !== 6) {
    return "#ffffff";
  }

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);
  const luminance = (0.299 * red) + (0.587 * green) + (0.114 * blue);

  return luminance > 186 ? "#111111" : "#ffffff";
}

function syncColorPickerField(field) {
  const input = field.querySelector('input[type="color"]');
  const valueLabel = field.querySelector("[data-color-picker-value]");

  if (!input || !valueLabel) {
    return;
  }

  const value = (input.value || "").toUpperCase();
  valueLabel.textContent = value;
  valueLabel.style.color = getContrastColor(value);
}

colorPickerFields.forEach((field) => {
  const input = field.querySelector('input[type="color"]');
  if (!input) {
    return;
  }

  syncColorPickerField(field);
  input.addEventListener("input", () => syncColorPickerField(field));
  input.addEventListener("change", () => syncColorPickerField(field));
});

const rangeFields = Array.from(document.querySelectorAll("[data-range-field]"));

function getRangePrecision(stepValue) {
  const step = String(stepValue || "");
  if (!step.includes(".")) {
    return 0;
  }

  return step.split(".")[1].length;
}

function syncRangeField(field) {
  const input = field.querySelector('input[type="range"]');
  const valueLabel = field.querySelector("[data-range-value]");

  if (!input || !valueLabel) {
    return;
  }

  const numericValue = Number.parseFloat(input.value || "0");
  const precision = getRangePrecision(input.step);
  valueLabel.textContent = Number.isNaN(numericValue)
    ? input.value
    : numericValue.toFixed(precision);
}

rangeFields.forEach((field) => {
  const input = field.querySelector('input[type="range"]');
  if (!input) {
    return;
  }

  syncRangeField(field);
  input.addEventListener("input", () => syncRangeField(field));
  input.addEventListener("change", () => syncRangeField(field));
});

const scrollTopButton = document.querySelector("[data-scroll-top-button]");

function syncScrollTopButton() {
  if (!scrollTopButton) {
    return;
  }

  const shouldShow = window.scrollY > 24;
  scrollTopButton.hidden = !shouldShow;
  scrollTopButton.classList.toggle("is-visible", shouldShow);
}

if (scrollTopButton) {
  scrollTopButton.addEventListener("click", () => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  });

  window.addEventListener("scroll", syncScrollTopButton, { passive: true });
  syncScrollTopButton();
}

const siteHeaderInner = document.querySelector(".site-header__inner");
const siteNav = document.querySelector("[data-site-nav]");
const siteNavToggle = document.querySelector("[data-site-nav-toggle]");
const siteNavLinks = Array.from(document.querySelectorAll("[data-site-nav] a"));
const mobileNavMediaQuery = window.matchMedia("(max-width: 720px)");

function setSiteNavOpen(open) {
  if (!siteHeaderInner || !siteNav || !siteNavToggle) {
    return;
  }

  siteHeaderInner.classList.toggle("site-header__inner--nav-open", open);
  siteNavToggle.setAttribute("aria-expanded", String(open));
  siteNavToggle.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
}

if (siteHeaderInner && siteNav && siteNavToggle) {
  siteNavToggle.addEventListener("click", () => {
    const isOpen = siteNavToggle.getAttribute("aria-expanded") === "true";
    setSiteNavOpen(!isOpen);
  });

  siteNavLinks.forEach((link) => {
    link.addEventListener("click", () => {
      if (mobileNavMediaQuery.matches) {
        setSiteNavOpen(false);
      }
    });
  });

  mobileNavMediaQuery.addEventListener("change", (event) => {
    if (!event.matches) {
      setSiteNavOpen(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && siteNavToggle.getAttribute("aria-expanded") === "true") {
      setSiteNavOpen(false);
    }
  });

  setSiteNavOpen(false);
}

const logoModeInputs = Array.from(document.querySelectorAll('input[name="logo_mode"]'));
const logoAnimationField = document.querySelector("[data-logo-animation-field]");
const logoAnimationSelect = logoAnimationField?.querySelector('select[name="logo_animation_mode"]') || null;
const logoParameterGroups = Array.from(document.querySelectorAll("[data-logo-parameter-group]"));
const logoAnimationPanel = document.querySelector(".admin-logo-parameters__animation-panel");
const logoParametersSection = document.querySelector("[data-logo-parameters]");
const adminLogoPreview = document.querySelector("[data-admin-logo-preview]");
const adminLogoStaticPreview = document.querySelector("[data-admin-logo-static-preview]");
const adminLogoAnimatedPreview = document.querySelector("[data-admin-logo-animated-preview]");

function syncLogoAnimationState() {
  if (!logoAnimationField || !logoAnimationSelect || logoModeInputs.length === 0) {
    return;
  }

  const selectedMode = logoModeInputs.find((input) => input.checked)?.value || "static";
  const isAnimated = selectedMode === "animated";
  const selectedAnimation = logoAnimationSelect.value || "signal";

  logoAnimationSelect.disabled = !isAnimated;
  logoAnimationField.hidden = !isAnimated;

  logoParameterGroups.forEach((group) => {
    const groupId = group.dataset.logoParameterGroup;
    const isShared = groupId === "shared";
    const shouldShow = isShared || (isAnimated && groupId === selectedAnimation);
    group.classList.toggle("is-hidden", !shouldShow);
  });

  if (logoParametersSection) {
    logoParametersSection.hidden = !isAnimated;
  }

  if (logoAnimationPanel) {
    logoAnimationPanel.classList.toggle("is-hidden", !isAnimated);
  }

  if (adminLogoStaticPreview && adminLogoAnimatedPreview) {
    adminLogoStaticPreview.classList.toggle("is-hidden", isAnimated);
    adminLogoAnimatedPreview.classList.toggle("is-hidden", !isAnimated);
  }

  if (isAnimated && adminLogoAnimatedPreview) {
    const logoSettings = adminLogoPreview?.dataset.logoSettings || "{}";
    adminLogoAnimatedPreview.innerHTML = `
      <span class="brand-mark brand-mark--animated admin-logo-preview__mark">
        <span class="brand-mark__canvas" data-logo-canvas data-logo-animation-mode="${selectedAnimation}" data-logo-settings="${logoSettings.replace(/"/g, "&quot;")}"></span>
      </span>
    `;

    if (typeof window.mountHeaderLogoSketches === "function") {
      window.mountHeaderLogoSketches();
    }
  }
}
logoModeInputs.forEach((input) => {
  input.addEventListener("change", syncLogoAnimationState);
});

logoAnimationSelect?.addEventListener("change", syncLogoAnimationState);

syncLogoAnimationState();

const settingsTabs = document.querySelector("[data-settings-tabs]");
const settingsTabTriggers = Array.from(document.querySelectorAll("[data-settings-tab-trigger]"));
const settingsTabPanels = Array.from(document.querySelectorAll("[data-settings-tab-panel]"));
const activeSettingsTabInput = document.querySelector("[data-active-settings-tab-input]");

function setActiveSettingsTab(targetId) {
  if (!settingsTabs || settingsTabTriggers.length === 0 || settingsTabPanels.length === 0) {
    return;
  }

  settingsTabTriggers.forEach((trigger) => {
    const isActive = trigger.dataset.settingsTabTarget === targetId;
    trigger.classList.toggle("is-active", isActive);
    trigger.setAttribute("aria-selected", String(isActive));
    trigger.tabIndex = isActive ? 0 : -1;
  });

  settingsTabPanels.forEach((panel) => {
    const isActive = panel.dataset.settingsTabPanelId === targetId;
    panel.classList.toggle("is-active", isActive);
  });

  if (activeSettingsTabInput) {
    activeSettingsTabInput.value = targetId;
  }
}

settingsTabTriggers.forEach((trigger) => {
  trigger.addEventListener("click", () => {
    setActiveSettingsTab(trigger.dataset.settingsTabTarget);
  });
});

if (settingsTabs && settingsTabTriggers.length > 0) {
  setActiveSettingsTab(activeSettingsTabInput?.value || settingsTabTriggers[0].dataset.settingsTabTarget);
}

const distributionTabGroups = Array.from(document.querySelectorAll("[data-distribution-tabs]"));

distributionTabGroups.forEach((distributionTabs) => {
  const distributionTabTriggers = Array.from(distributionTabs.querySelectorAll("[data-distribution-tab-trigger]"));
  const distributionTabPanels = Array.from(distributionTabs.querySelectorAll("[data-distribution-tab-panel]"));
  const activeDistributionTabInput = distributionTabs.parentElement?.querySelector("[data-active-distribution-tab-input]") || distributionTabs.querySelector("[data-active-distribution-tab-input]");

  function setActiveDistributionTab(targetId) {
    if (distributionTabTriggers.length === 0 || distributionTabPanels.length === 0) {
      return;
    }

    distributionTabTriggers.forEach((trigger) => {
      const isActive = trigger.dataset.distributionTabTarget === targetId;
      trigger.classList.toggle("is-active", isActive);
      trigger.setAttribute("aria-selected", String(isActive));
      trigger.tabIndex = isActive ? 0 : -1;
    });

    distributionTabPanels.forEach((panel) => {
      const isActive = panel.dataset.distributionTabPanelId === targetId;
      panel.classList.toggle("is-active", isActive);
      panel.hidden = !isActive;
    });

    if (activeDistributionTabInput) {
      activeDistributionTabInput.value = targetId;
    }
  }

  distributionTabTriggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      setActiveDistributionTab(trigger.dataset.distributionTabTarget);
    });
  });

  if (distributionTabTriggers.length > 0) {
    setActiveDistributionTab(activeDistributionTabInput?.value || distributionTabTriggers[0].dataset.distributionTabTarget);
  }
});

const projectTabs = document.querySelector("[data-project-tabs]");
const projectTabTriggers = Array.from(document.querySelectorAll("[data-project-tab-trigger]"));
const projectTabPanels = Array.from(document.querySelectorAll("[data-project-tab-panel]"));
const activeProjectTabInput = document.querySelector("[data-active-project-tab-input]");

function setActiveProjectTab(targetId) {
  if (!projectTabs || projectTabTriggers.length === 0 || projectTabPanels.length === 0) {
    return;
  }

  projectTabTriggers.forEach((trigger) => {
    const isActive = trigger.dataset.projectTabTarget === targetId;
    trigger.classList.toggle("is-active", isActive);
    trigger.setAttribute("aria-selected", String(isActive));
    trigger.tabIndex = isActive ? 0 : -1;
  });

  projectTabPanels.forEach((panel) => {
    const isActive = panel.dataset.projectTabPanelId === targetId;
    panel.classList.toggle("is-active", isActive);
  });

  if (activeProjectTabInput) {
    activeProjectTabInput.value = targetId;
  }
}

projectTabTriggers.forEach((trigger) => {
  trigger.addEventListener("click", () => {
    setActiveProjectTab(trigger.dataset.projectTabTarget);
  });
});

if (projectTabs && projectTabTriggers.length > 0) {
  setActiveProjectTab(activeProjectTabInput?.value || projectTabTriggers[0].dataset.projectTabTarget);
}

const postTabs = document.querySelector("[data-post-tabs]");
const postTabTriggers = Array.from(document.querySelectorAll("[data-post-tab-trigger]"));
const postTabPanels = Array.from(document.querySelectorAll("[data-post-tab-panel]"));
const activePostTabInput = document.querySelector("[data-active-post-tab-input]");

function setActivePostTab(targetId) {
  if (!postTabs || postTabTriggers.length === 0 || postTabPanels.length === 0) {
    return;
  }

  postTabTriggers.forEach((trigger) => {
    const isActive = trigger.dataset.postTabTarget === targetId;
    trigger.classList.toggle("is-active", isActive);
    trigger.setAttribute("aria-selected", String(isActive));
    trigger.tabIndex = isActive ? 0 : -1;
  });

  postTabPanels.forEach((panel) => {
    const isActive = panel.dataset.postTabPanelId === targetId;
    panel.classList.toggle("is-active", isActive);
  });

  if (activePostTabInput) {
    activePostTabInput.value = targetId;
  }
}

postTabTriggers.forEach((trigger) => {
  trigger.addEventListener("click", () => {
    setActivePostTab(trigger.dataset.postTabTarget);
  });
});

if (postTabs && postTabTriggers.length > 0) {
  setActivePostTab(activePostTabInput?.value || postTabTriggers[0].dataset.postTabTarget);
}

const mediaTabs = document.querySelector("[data-media-tabs]");
const mediaTabTriggers = Array.from(document.querySelectorAll("[data-media-tab-trigger]"));
const mediaTabPanels = Array.from(document.querySelectorAll("[data-media-tab-panel]"));

function setActiveMediaTab(targetId) {
  if (!mediaTabs || mediaTabTriggers.length === 0 || mediaTabPanels.length === 0) {
    return;
  }

  mediaTabTriggers.forEach((trigger) => {
    const isActive = trigger.dataset.mediaTabTarget === targetId;
    trigger.classList.toggle("is-active", isActive);
    trigger.setAttribute("aria-selected", String(isActive));
    trigger.tabIndex = isActive ? 0 : -1;
  });

  mediaTabPanels.forEach((panel) => {
    const isActive = panel.dataset.mediaTabPanelId === targetId;
    panel.classList.toggle("is-active", isActive);
  });
}

mediaTabTriggers.forEach((trigger) => {
  trigger.addEventListener("click", () => {
    setActiveMediaTab(trigger.dataset.mediaTabTarget);
  });
});

if (mediaTabs && mediaTabTriggers.length > 0) {
  const activeMediaTrigger = mediaTabTriggers.find((trigger) => trigger.classList.contains("is-active"));
  setActiveMediaTab(activeMediaTrigger?.dataset.mediaTabTarget || mediaTabTriggers[0].dataset.mediaTabTarget);
}

const mediaViewTriggers = Array.from(document.querySelectorAll("[data-media-view-trigger]"));
const mediaViewPanels = Array.from(document.querySelectorAll("[data-media-view-panel]"));

function setActiveMediaView(targetId) {
  if (mediaViewTriggers.length === 0 || mediaViewPanels.length === 0) {
    return;
  }

  mediaViewTriggers.forEach((trigger) => {
    const isActive = trigger.dataset.mediaViewTarget === targetId;
    trigger.classList.toggle("is-active", isActive);
    trigger.setAttribute("aria-pressed", String(isActive));
  });

  mediaViewPanels.forEach((panel) => {
    const isActive = panel.dataset.mediaViewPanelId === targetId;
    panel.classList.toggle("is-active", isActive);
    panel.hidden = !isActive;
    panel.querySelectorAll("[data-media-view-input]").forEach((input) => {
      input.disabled = !isActive;
    });
  });
}

mediaViewTriggers.forEach((trigger) => {
  trigger.addEventListener("click", () => {
    setActiveMediaView(trigger.dataset.mediaViewTarget);
  });
});

if (mediaViewTriggers.length > 0 && mediaViewPanels.length > 0) {
  const activeMediaViewTrigger = mediaViewTriggers.find((trigger) => trigger.classList.contains("is-active"));
  setActiveMediaView(activeMediaViewTrigger?.dataset.mediaViewTarget || mediaViewTriggers[0].dataset.mediaViewTarget);
}

const projectCreateUploadSubmit = document.querySelector("[data-project-create-upload-submit]");
const projectEditForm = document.querySelector("#project-edit-form");
const postCreateUploadSubmit = document.querySelector("[data-post-create-upload-submit]");
const postEditForm = document.querySelector("#post-edit-form");

projectCreateUploadSubmit?.addEventListener("click", () => {
  if (!projectEditForm) {
    return;
  }

  if (!projectEditForm.reportValidity()) {
    setActiveProjectTab("details");
    projectEditForm.reportValidity();
    return;
  }

  projectEditForm.requestSubmit();
});

postCreateUploadSubmit?.addEventListener("click", () => {
  if (!postEditForm) {
    return;
  }

  if (!postEditForm.reportValidity()) {
    setActivePostTab("details");
    postEditForm.reportValidity();
    return;
  }

  postEditForm.requestSubmit();
});

const ADMIN_FORM_DRAFT_PENDING_KEY = "gagnaux-admin-form-draft-pending";

function setupCreateFormDraftPersistence(options) {
  const { form, kind, fields } = options;
  if (!form) {
    return;
  }

  const uploadSessionInput = form.querySelector('input[name="upload_session_id"]');
  const uploadSessionId = uploadSessionInput?.value;
  const isNewPath = window.location.pathname === `/admin/${kind}s/new`;

  if (!uploadSessionId || !isNewPath) {
    return;
  }

  const storageKey = `gagnaux-admin-form-draft:${kind}:${uploadSessionId}`;

  function readDraftState() {
    try {
      return JSON.parse(window.sessionStorage.getItem(storageKey) || "{}");
    } catch (error) {
      return {};
    }
  }

  function writeDraftState() {
    const nextState = {};
    fields.forEach((name) => {
      const input = form.elements.namedItem(name);
      if (!input) {
        return;
      }

      if (input instanceof RadioNodeList) {
        const selected = Array.from(input).find((node) => node.checked);
        nextState[name] = selected ? selected.value : "";
        return;
      }

      nextState[name] = input.type === "checkbox" ? Boolean(input.checked) : input.value;
    });

    try {
      window.sessionStorage.setItem(storageKey, JSON.stringify(nextState));
    } catch (error) {
      // Ignore storage failures and keep the current form state active.
    }
  }

  const draftState = readDraftState();
  fields.forEach((name) => {
    const input = form.elements.namedItem(name);
    if (!input || !(name in draftState)) {
      return;
    }

    if (input instanceof RadioNodeList) {
      Array.from(input).forEach((node) => {
        node.checked = node.value === draftState[name];
      });
      return;
    }

    if (input.type === "checkbox") {
      input.checked = Boolean(draftState[name]);
    } else {
      input.value = draftState[name] || "";
    }
  });

  fields.forEach((name) => {
    const input = form.elements.namedItem(name);
    if (!input) {
      return;
    }

    const nodes = input instanceof RadioNodeList ? Array.from(input) : [input];
    nodes.forEach((node) => {
      node.addEventListener("input", writeDraftState);
      node.addEventListener("change", writeDraftState);
    });
  });

  form.addEventListener("submit", () => {
    writeDraftState();
    try {
      window.sessionStorage.setItem(ADMIN_FORM_DRAFT_PENDING_KEY, storageKey);
    } catch (error) {
      // Ignore storage failures and continue submitting.
    }
  });
}

try {
  const pendingDraftKey = window.sessionStorage.getItem(ADMIN_FORM_DRAFT_PENDING_KEY);
  const isCreatePage = window.location.pathname === "/admin/posts/new" || window.location.pathname === "/admin/projects/new";

  if (pendingDraftKey && !isCreatePage) {
    window.sessionStorage.removeItem(pendingDraftKey);
    window.sessionStorage.removeItem(ADMIN_FORM_DRAFT_PENDING_KEY);
  }
} catch (error) {
  // Ignore storage failures and continue with page initialization.
}

setupCreateFormDraftPersistence({
  form: projectEditForm,
  kind: "project",
  fields: [
    "title",
    "slug",
    "summary",
    "description_markdown",
    "project_type",
    "external_url",
    "internal_url",
    "is_featured"
  ]
});

setupCreateFormDraftPersistence({
  form: postEditForm,
  kind: "post",
  fields: [
    "title",
    "slug",
    "excerpt",
    "body_markdown",
    "tags",
    "status",
    "is_featured"
  ]
});

function parseTagValues(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item, index, items) => items.indexOf(item) === index);
}

function setupTagInput(root) {
  if (!root) {
    return;
  }

  const hiddenInput = root.parentElement?.querySelector("[data-tag-input-value]");
  const textInput = root.querySelector("[data-tag-input-field]");
  const pillsContainer = root.querySelector("[data-tag-input-pills]");
  if (!hiddenInput || !textInput || !pillsContainer) {
    return;
  }

  let tags = parseTagValues(hiddenInput.value);

  function syncHiddenInput() {
    hiddenInput.value = tags.join(", ");
    hiddenInput.dispatchEvent(new Event("input", { bubbles: true }));
    hiddenInput.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function renderTags() {
    pillsContainer.innerHTML = "";

    if (!tags.length) {
      const emptyState = document.createElement("span");
      emptyState.className = "admin-tag-input__empty";
      emptyState.textContent = "No tags yet.";
      pillsContainer.append(emptyState);
      return;
    }

    tags.forEach((tag) => {
      const pill = document.createElement("button");
      pill.type = "button";
      pill.className = "admin-tag-input__pill";
      pill.setAttribute("aria-label", `Remove tag ${tag}`);

      const label = document.createElement("span");
      label.textContent = tag;
      pill.append(label);

      const remove = document.createElement("span");
      remove.className = "admin-tag-input__remove";
      remove.setAttribute("aria-hidden", "true");
      remove.textContent = "x";
      pill.append(remove);

      pill.addEventListener("click", () => {
        tags = tags.filter((value) => value !== tag);
        syncHiddenInput();
        renderTags();
        textInput.focus();
      });

      pillsContainer.append(pill);
    });
  }

  function commitTagValue(rawValue) {
    const nextTags = parseTagValues(rawValue);
    if (!nextTags.length) {
      textInput.value = "";
      return;
    }

    nextTags.forEach((tag) => {
      if (!tags.includes(tag)) {
        tags.push(tag);
      }
    });

    textInput.value = "";
    syncHiddenInput();
    renderTags();
  }

  textInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== ",") {
      return;
    }

    event.preventDefault();
    commitTagValue(textInput.value);
  });

  textInput.addEventListener("blur", () => {
    commitTagValue(textInput.value);
  });

  renderTags();
}

setupTagInput(document.querySelector("[data-tag-input]"));

const ADMIN_SIDEBAR_STORAGE_KEY = "gagnaux-admin-sidebar-collapsed";
const adminShell = document.querySelector(".admin-shell");
const adminSidebar = document.querySelector("[data-admin-sidebar]");
const adminSidebarToggle = document.querySelector("[data-admin-sidebar-toggle]");
const adminSidebarTab = document.querySelector("[data-admin-sidebar-tab]");

function setAdminSidebarCollapsed(collapsed) {
  if (!adminShell || !adminSidebar || !adminSidebarToggle || !adminSidebarTab) {
    return;
  }

  adminShell.classList.toggle("admin-shell--sidebar-collapsed", collapsed);
  adminSidebarToggle.setAttribute("aria-label", collapsed ? "Show admin menu" : "Hide admin menu");
  adminSidebarTab.setAttribute("aria-label", collapsed ? "Show admin menu" : "Hide admin menu");
  adminSidebarToggle.innerHTML = `<span aria-hidden="true">${collapsed ? ">" : "<"}</span>`;

  try {
    window.localStorage.setItem(ADMIN_SIDEBAR_STORAGE_KEY, collapsed ? "true" : "false");
  } catch (error) {
    // Ignore storage failures and keep the current state active.
  }
}

function getInitialAdminSidebarState() {
  if (!adminShell || !adminSidebar || !adminSidebarToggle || !adminSidebarTab) {
    return false;
  }

  try {
    return window.localStorage.getItem(ADMIN_SIDEBAR_STORAGE_KEY) === "true";
  } catch (error) {
    return false;
  }
}

function toggleAdminSidebar() {
  setAdminSidebarCollapsed(!adminShell.classList.contains("admin-shell--sidebar-collapsed"));
}

if (adminShell && adminSidebar && adminSidebarToggle && adminSidebarTab) {
  adminSidebarToggle.addEventListener("click", toggleAdminSidebar);
  adminSidebarTab.addEventListener("click", toggleAdminSidebar);
  setAdminSidebarCollapsed(getInitialAdminSidebarState());
}

const projectCarousels = Array.from(document.querySelectorAll("[data-project-carousel]"));

function getProjectCarouselImages(carousel) {
  try {
    const parsedImages = JSON.parse(carousel.dataset.carouselImages || "[]");
    return Array.isArray(parsedImages) ? parsedImages.filter(Boolean) : [];
  } catch (error) {
    return [];
  }
}

function updateProjectCarouselImage(carousel, nextIndex, direction) {
  const currentImage = carousel.querySelector("[data-carousel-image-current]");
  const nextImage = carousel.querySelector("[data-carousel-image-next]");
  const images = getProjectCarouselImages(carousel);
  const count = images.length;
  const currentIndex = Number.parseInt(carousel.dataset.carouselIndex || "0", 10);

  if (!currentImage || !nextImage || count === 0) {
    return;
  }

  const normalizedIndex = ((nextIndex % count) + count) % count;
  if (normalizedIndex === currentIndex || carousel.dataset.carouselAnimating === "true") {
    return;
  }

  carousel.dataset.carouselAnimating = "true";
  carousel.dataset.carouselIndex = String(normalizedIndex);
  nextImage.src = images[normalizedIndex];
  nextImage.style.transition = "none";
  nextImage.style.opacity = "1";
  nextImage.style.transform = direction === "prev" ? "translateX(-100%)" : "translateX(100%)";
  currentImage.style.transition = "none";
  currentImage.style.opacity = "1";
  currentImage.style.transform = "translateX(0)";

  requestAnimationFrame(() => {
    currentImage.style.transition = "";
    nextImage.style.transition = "";
    currentImage.style.transform = direction === "prev" ? "translateX(100%)" : "translateX(-100%)";
    currentImage.style.opacity = "0";
    nextImage.style.transform = "translateX(0)";
  });

  window.setTimeout(() => {
    currentImage.style.transition = "none";
    nextImage.style.transition = "none";
    currentImage.style.transform = "";
    currentImage.style.opacity = "";
    nextImage.style.transform = "";
    nextImage.style.opacity = "1";

    currentImage.removeAttribute("data-carousel-image-current");
    currentImage.setAttribute("data-carousel-image-next", "");
    nextImage.removeAttribute("data-carousel-image-next");
    nextImage.setAttribute("data-carousel-image-current", "");

    requestAnimationFrame(() => {
      currentImage.style.transition = "";
      nextImage.style.transition = "";
    });

    carousel.dataset.carouselAnimating = "false";
  }, 280);
}

projectCarousels.forEach((carousel) => {
  const prevButton = carousel.querySelector("[data-carousel-prev]");
  const nextButton = carousel.querySelector("[data-carousel-next]");
  const initialIndex = Number.parseInt(carousel.dataset.carouselIndex || "0", 10);

  carousel.dataset.carouselIndex = String(Number.isNaN(initialIndex) ? 0 : initialIndex);
  carousel.dataset.carouselAnimating = "false";

  prevButton?.addEventListener("click", () => {
    updateProjectCarouselImage(carousel, Number.parseInt(carousel.dataset.carouselIndex || "0", 10) - 1, "prev");
  });

  nextButton?.addEventListener("click", () => {
    updateProjectCarouselImage(carousel, Number.parseInt(carousel.dataset.carouselIndex || "0", 10) + 1, "next");
  });
});

const lightboxModal = document.querySelector("[data-lightbox-modal]");
const lightboxImage = document.querySelector("[data-lightbox-image]");
const lightboxPrevButton = document.querySelector("[data-lightbox-prev]");
const lightboxNextButton = document.querySelector("[data-lightbox-next]");
const lightboxCloseButtons = Array.from(document.querySelectorAll("[data-lightbox-close]"));
let activeLightboxCarousel = null;

function updateLightboxImage() {
  if (!lightboxModal || !lightboxImage || !activeLightboxCarousel) {
    return;
  }

  const images = getProjectCarouselImages(activeLightboxCarousel);
  const count = images.length;
  const index = Number.parseInt(activeLightboxCarousel.dataset.carouselIndex || "0", 10);

  lightboxImage.src = images[index] || "";
  lightboxImage.alt = activeLightboxCarousel.querySelector("[data-carousel-image-current]")?.alt || "Project screenshot";

  const showNav = count > 1;
  if (lightboxPrevButton) {
    lightboxPrevButton.hidden = !showNav;
  }
  if (lightboxNextButton) {
    lightboxNextButton.hidden = !showNav;
  }
}

function closeLightbox() {
  if (!lightboxModal) {
    return;
  }

  lightboxModal.hidden = true;
  activeLightboxCarousel = null;
}

if (lightboxModal && lightboxImage) {
  projectCarousels.forEach((carousel) => {
    carousel.addEventListener("click", (event) => {
      if (event.target.closest("[data-carousel-prev], [data-carousel-next]")) {
        return;
      }

      activeLightboxCarousel = carousel;
      updateLightboxImage();
      lightboxModal.hidden = false;
    });
  });

  lightboxCloseButtons.forEach((button) => {
    button.addEventListener("click", closeLightbox);
  });

  lightboxPrevButton?.addEventListener("click", () => {
    if (!activeLightboxCarousel) {
      return;
    }

    updateProjectCarouselImage(activeLightboxCarousel, Number.parseInt(activeLightboxCarousel.dataset.carouselIndex || "0", 10) - 1, "prev");
    window.setTimeout(updateLightboxImage, 290);
  });

  lightboxNextButton?.addEventListener("click", () => {
    if (!activeLightboxCarousel) {
      return;
    }

    updateProjectCarouselImage(activeLightboxCarousel, Number.parseInt(activeLightboxCarousel.dataset.carouselIndex || "0", 10) + 1, "next");
    window.setTimeout(updateLightboxImage, 290);
  });

  document.addEventListener("keydown", (event) => {
    if (lightboxModal.hidden) {
      return;
    }

    if (event.key === "Escape") {
      closeLightbox();
    } else if (event.key === "ArrowLeft") {
      lightboxPrevButton?.click();
    } else if (event.key === "ArrowRight") {
      lightboxNextButton?.click();
    }
  });
}

const projectModal = document.querySelector("[data-project-modal]");
const projectModalFrame = document.querySelector("[data-project-modal-frame]");
const projectModalTitle = document.getElementById("project-modal-title");
const projectModalTriggers = Array.from(document.querySelectorAll("[data-project-modal-trigger]"));
const projectModalCloseButtons = Array.from(document.querySelectorAll("[data-project-modal-close]"));
let activeProjectModalTrigger = null;

function openProjectModal(trigger) {
  if (!projectModal || !projectModalFrame || !projectModalTitle) {
    return;
  }

  const url = trigger.dataset.projectModalUrl;
  const title = trigger.dataset.projectModalTitle || "Project preview";

  if (!url) {
    return;
  }

  activeProjectModalTrigger = trigger;
  projectModalTitle.textContent = title;
  projectModalFrame.title = `${title} preview`;
  projectModalFrame.src = url;
  projectModal.hidden = false;
  projectModal.querySelector(".project-modal__close")?.focus();
}

function closeProjectModal() {
  if (!projectModal || projectModal.hidden) {
    return;
  }

  projectModal.hidden = true;

  if (projectModalFrame) {
    projectModalFrame.src = "about:blank";
  }

  activeProjectModalTrigger?.focus();
  activeProjectModalTrigger = null;
}

if (projectModal && projectModalFrame && projectModalTitle) {
  projectModalTriggers.forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      openProjectModal(trigger);
    });
  });

  projectModalCloseButtons.forEach((button) => {
    button.addEventListener("click", closeProjectModal);
  });

  document.addEventListener("keydown", (event) => {
    if (projectModal.hidden) {
      return;
    }

    if (event.key === "Escape") {
      closeProjectModal();
    }
  });
}

const projectSortableBody = document.querySelector("[data-project-sortable]");

if (projectSortableBody) {
  let draggingRow = null;

  function getProjectIds() {
    return Array.from(projectSortableBody.querySelectorAll("[data-project-row]"))
      .map((row) => Number.parseInt(row.dataset.projectId || "", 10))
      .filter((id) => Number.isInteger(id));
  }

  function clearProjectDropTargets() {
    projectSortableBody.querySelectorAll(".is-drop-target").forEach((item) => {
      item.classList.remove("is-drop-target");
    });
  }

  function getProjectDropTarget(clientY) {
    const rows = Array.from(projectSortableBody.querySelectorAll("[data-project-row]"))
      .filter((row) => row !== draggingRow);

    if (rows.length === 0) {
      return null;
    }

    const firstRow = rows[0];
    if (clientY <= firstRow.getBoundingClientRect().bottom) {
      return firstRow;
    }

    return rows.slice(1).find((row) => {
      const { top, height } = row.getBoundingClientRect();
      return clientY < top + (height / 2);
    }) || null;
  }

  async function persistProjectOrder() {
    const response = await fetch("/admin/projects/reorder", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ projectIds: getProjectIds() })
    });

    if (!response.ok) {
      throw new Error("Failed to save project order.");
    }
  }

  projectSortableBody.querySelectorAll("[data-project-row]").forEach((row) => {
    row.addEventListener("dragstart", (event) => {
      draggingRow = row;
      row.classList.add("is-dragging");
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", row.dataset.projectId || "");
    });

    row.addEventListener("dragend", () => {
      row.classList.remove("is-dragging");
      clearProjectDropTargets();
      draggingRow = null;
    });
  });

  projectSortableBody.addEventListener("dragover", (event) => {
    if (!draggingRow) {
      return;
    }

    event.preventDefault();
    clearProjectDropTargets();

    const dropTarget = getProjectDropTarget(event.clientY);
    if (dropTarget) {
      dropTarget.classList.add("is-drop-target");
    }
  });

  projectSortableBody.addEventListener("drop", async (event) => {
    if (!draggingRow) {
      return;
    }

    event.preventDefault();
    const dropTarget = getProjectDropTarget(event.clientY);
    clearProjectDropTargets();

    if (dropTarget) {
      dropTarget.before(draggingRow);
    } else {
      projectSortableBody.append(draggingRow);
    }

    try {
      await persistProjectOrder();
    } catch (error) {
      window.location.reload();
    }
  });
}

const projectScreenshotSortable = document.querySelector("[data-project-screenshot-sortable]");

if (projectScreenshotSortable) {
  let draggingScreenshotCard = null;

  function getScreenshotIds() {
    return Array.from(projectScreenshotSortable.querySelectorAll("[data-project-screenshot-card]"))
      .map((card) => Number.parseInt(card.dataset.screenshotId || "", 10))
      .filter((id) => Number.isInteger(id));
  }

  async function persistScreenshotOrder() {
    const projectId = projectScreenshotSortable.dataset.projectId;
    const response = await fetch(`/admin/projects/${projectId}/screenshots/reorder`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ screenshotIds: getScreenshotIds() })
    });

    if (!response.ok) {
      throw new Error("Failed to save screenshot order.");
    }
  }

  projectScreenshotSortable.querySelectorAll("[data-project-screenshot-card]").forEach((card) => {
    card.addEventListener("dragstart", (event) => {
      draggingScreenshotCard = card;
      card.classList.add("is-dragging");
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", card.dataset.screenshotId || "");
    });

    card.addEventListener("dragend", () => {
      card.classList.remove("is-dragging");
      projectScreenshotSortable.querySelectorAll(".is-drop-target").forEach((item) => {
        item.classList.remove("is-drop-target");
      });
      draggingScreenshotCard = null;
    });

    card.addEventListener("dragover", (event) => {
      if (!draggingScreenshotCard || draggingScreenshotCard === card) {
        return;
      }

      event.preventDefault();
      projectScreenshotSortable.querySelectorAll(".is-drop-target").forEach((item) => {
        item.classList.remove("is-drop-target");
      });
      card.classList.add("is-drop-target");
    });

    card.addEventListener("drop", async (event) => {
      if (!draggingScreenshotCard || draggingScreenshotCard === card) {
        return;
      }

      event.preventDefault();
      card.classList.remove("is-drop-target");

      const { left, width } = card.getBoundingClientRect();
      const insertAfter = event.clientX > left + width / 2;

      if (insertAfter) {
        card.after(draggingScreenshotCard);
      } else {
        card.before(draggingScreenshotCard);
      }

      try {
        await persistScreenshotOrder();
      } catch (error) {
        window.location.reload();
      }
    });
  });
}

const screenshotUploadForm = document.querySelector("[data-screenshot-upload-form]");
const screenshotUploadInput = document.querySelector("[data-screenshot-upload-input]");
const screenshotUploadActions = document.querySelector("[data-screenshot-upload-actions]");
const screenshotUploadError = document.querySelector("[data-screenshot-upload-error]");
const MAX_SCREENSHOT_UPLOAD_BYTES = 8 * 1024 * 1024;

function setScreenshotUploadError(message) {
  if (!screenshotUploadError) {
    return;
  }

  screenshotUploadError.hidden = !message;
  screenshotUploadError.textContent = message || "";
}

function validateScreenshotUploadFiles() {
  if (!screenshotUploadInput?.files || screenshotUploadInput.files.length === 0) {
    setScreenshotUploadError("");
    return true;
  }

  const oversizedFile = Array.from(screenshotUploadInput.files).find((file) => file.size > MAX_SCREENSHOT_UPLOAD_BYTES);
  if (!oversizedFile) {
    setScreenshotUploadError("");
    return true;
  }

  setScreenshotUploadError(`\"${oversizedFile.name}\" exceeds the 8 MB upload limit. Please choose a smaller image.`);
  return false;
}

function syncScreenshotUploadActions() {
  if (!screenshotUploadForm || !screenshotUploadInput || !screenshotUploadActions) {
    return;
  }

  const hasFiles = Boolean(screenshotUploadInput.files && screenshotUploadInput.files.length > 0);
  const isValid = validateScreenshotUploadFiles();
  screenshotUploadActions.hidden = !hasFiles || !isValid;
}

if (screenshotUploadInput && screenshotUploadActions) {
  screenshotUploadInput.addEventListener("change", syncScreenshotUploadActions);
  screenshotUploadForm?.addEventListener("submit", (event) => {
    if (!validateScreenshotUploadFiles()) {
      event.preventDefault();
      syncScreenshotUploadActions();
    }
  });
  syncScreenshotUploadActions();
}

const screenshotSelectionForm = document.querySelector("[data-screenshot-selection-form]");
const screenshotSelectionInputs = Array.from(document.querySelectorAll("[data-screenshot-select]"));
const screenshotBulkActions = document.querySelector("[data-screenshot-bulk-actions]");

function syncScreenshotBulkActions() {
  if (!screenshotSelectionForm || !screenshotBulkActions || screenshotSelectionInputs.length === 0) {
    return;
  }

  screenshotBulkActions.hidden = !screenshotSelectionInputs.some((input) => input.checked);
}

if (screenshotSelectionForm && screenshotBulkActions && screenshotSelectionInputs.length > 0) {
  screenshotSelectionInputs.forEach((input) => {
    input.addEventListener("change", syncScreenshotBulkActions);
  });
  syncScreenshotBulkActions();
}

const postImageUploadForm = document.querySelector("[data-post-image-upload-form]");
const postImageUploadInput = document.querySelector("[data-post-image-upload-input]");
const postImageUploadActions = document.querySelector("[data-post-image-upload-actions]");

function syncPostImageUploadActions() {
  if (!postImageUploadForm || !postImageUploadInput || !postImageUploadActions) {
    return;
  }

  postImageUploadActions.hidden = !postImageUploadInput.files || postImageUploadInput.files.length === 0;
}

if (postImageUploadInput && postImageUploadActions) {
  postImageUploadInput.addEventListener("change", syncPostImageUploadActions);
  syncPostImageUploadActions();
}

const postImageSelectionForm = document.querySelector("[data-post-image-selection-form]");
const postImageSelectionInputs = Array.from(document.querySelectorAll("[data-post-image-select]"));
const postImageBulkActions = document.querySelector("[data-post-image-bulk-actions]");

function syncPostImageBulkActions() {
  if (!postImageSelectionForm || !postImageBulkActions || postImageSelectionInputs.length === 0) {
    return;
  }

  postImageBulkActions.hidden = !postImageSelectionInputs.some((input) => input.checked);
}

if (postImageSelectionForm && postImageBulkActions && postImageSelectionInputs.length > 0) {
  postImageSelectionInputs.forEach((input) => {
    input.addEventListener("change", syncPostImageBulkActions);
  });
  syncPostImageBulkActions();
}

const mediaSelectionForm = document.querySelector("[data-media-selection-form]");
const mediaSelectionInputs = Array.from(document.querySelectorAll("[data-media-select]"));
const mediaBulkActions = document.querySelector("[data-media-bulk-actions]");

function syncMediaSelectionState(changedInput) {
  const itemId = changedInput.dataset.mediaItemId;
  if (!itemId) {
    return;
  }

  mediaSelectionInputs.forEach((input) => {
    if (input !== changedInput && input.dataset.mediaItemId === itemId) {
      input.checked = changedInput.checked;
    }
  });
}

function syncMediaBulkActions() {
  if (!mediaSelectionForm || !mediaBulkActions || mediaSelectionInputs.length === 0) {
    return;
  }

  mediaBulkActions.hidden = !mediaSelectionInputs.some((input) => input.checked);
}

if (mediaSelectionForm && mediaBulkActions && mediaSelectionInputs.length > 0) {
  mediaSelectionInputs.forEach((input) => {
    input.addEventListener("change", () => {
      syncMediaSelectionState(input);
      syncMediaBulkActions();
    });
  });
  syncMediaBulkActions();
}

const markdownDropzones = Array.from(document.querySelectorAll("[data-markdown-dropzone]"));
const markdownAssets = Array.from(document.querySelectorAll("[data-markdown-asset]"));

function insertTextAtTextareaCursor(textarea, snippet) {
  const value = textarea.value || "";
  const start = typeof textarea.selectionStart === "number" ? textarea.selectionStart : value.length;
  const end = typeof textarea.selectionEnd === "number" ? textarea.selectionEnd : value.length;
  const needsLeadingBreak = start > 0 && !value.slice(0, start).endsWith("\n\n");
  const needsTrailingBreak = end < value.length && !value.slice(end).startsWith("\n\n");
  const prefix = needsLeadingBreak ? "\n\n" : "";
  const suffix = needsTrailingBreak ? "\n\n" : "";
  const insertion = `${prefix}${snippet}${suffix}`;

  textarea.setRangeText(insertion, start, end, "end");
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
  textarea.focus();
}

if (markdownDropzones.length > 0 && markdownAssets.length > 0) {
  let draggedMarkdownSnippet = "";

  function clearMarkdownDropTargets() {
    markdownDropzones.forEach((dropzone) => dropzone.classList.remove("is-drop-target"));
  }

  markdownAssets.forEach((item) => {
    item.addEventListener("dragstart", (event) => {
      draggedMarkdownSnippet = item.getAttribute("data-markdown-snippet") || "";
      item.classList.add("is-dragging");
      event.dataTransfer.effectAllowed = "copy";
      event.dataTransfer.setData("text/plain", draggedMarkdownSnippet);
    });

    item.addEventListener("dragend", () => {
      item.classList.remove("is-dragging");
      clearMarkdownDropTargets();
    });
  });

  markdownDropzones.forEach((dropzone) => {
    dropzone.addEventListener("dragover", (event) => {
      if (!draggedMarkdownSnippet) {
        return;
      }

      event.preventDefault();
      clearMarkdownDropTargets();
      dropzone.classList.add("is-drop-target");
    });

    dropzone.addEventListener("dragleave", (event) => {
      if (event.target === dropzone) {
        dropzone.classList.remove("is-drop-target");
      }
    });

    dropzone.addEventListener("drop", (event) => {
      const snippet = draggedMarkdownSnippet || event.dataTransfer.getData("text/plain");
      if (!snippet) {
        return;
      }

      event.preventDefault();
      dropzone.classList.remove("is-drop-target");
      insertTextAtTextareaCursor(dropzone, snippet);
      draggedMarkdownSnippet = "";
    });
  });
}
const confirmDeleteForms = Array.from(document.querySelectorAll("[data-confirm-delete-form]"));
const confirmModal = document.querySelector("[data-confirm-modal]");

if (confirmDeleteForms.length > 0 && confirmModal) {
  const confirmModalTitle = confirmModal.querySelector("[data-confirm-modal-title]");
  const confirmModalMessage = confirmModal.querySelector("[data-confirm-modal-message]");
  const confirmAcceptButton = confirmModal.querySelector("[data-confirm-accept]");
  const confirmCancelButtons = Array.from(confirmModal.querySelectorAll("[data-confirm-cancel]"));
  const confirmExtraCheckbox = confirmModal.querySelector("[data-confirm-extra-checkbox]");
  const confirmExtraCheckboxInput = confirmModal.querySelector("[data-confirm-extra-checkbox-input]");
  const confirmExtraCheckboxLabel = confirmModal.querySelector("[data-confirm-extra-checkbox-label]");
  let pendingDeleteForm = null;
  let pendingDeleteSecondStage = false;
  let pendingExtraCheckboxChecked = false;

  function closeConfirmModal() {
    confirmModal.hidden = true;
    pendingDeleteForm = null;
    pendingDeleteSecondStage = false;
    pendingExtraCheckboxChecked = false;

    if (confirmExtraCheckbox) {
      confirmExtraCheckbox.hidden = true;
    }
    if (confirmExtraCheckboxInput) {
      confirmExtraCheckboxInput.checked = false;
    }
    if (confirmExtraCheckboxLabel) {
      confirmExtraCheckboxLabel.textContent = "";
    }
  }

  confirmDeleteForms.forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      pendingDeleteForm = form;
      pendingDeleteSecondStage = false;
      pendingExtraCheckboxChecked = false;
      confirmModalTitle.textContent = form.dataset.confirmTitle || "Confirm delete";
      confirmModalMessage.innerHTML = form.dataset.confirmMessage || "Are you sure?";

      const extraCheckboxLabel = form.dataset.confirmExtraCheckboxLabel || "";
      if (confirmExtraCheckbox && confirmExtraCheckboxInput && confirmExtraCheckboxLabel && extraCheckboxLabel) {
        confirmExtraCheckbox.hidden = false;
        confirmExtraCheckboxInput.checked = false;
        confirmExtraCheckboxLabel.textContent = extraCheckboxLabel;
      } else if (confirmExtraCheckbox) {
        confirmExtraCheckbox.hidden = true;
      }

      confirmModal.hidden = false;
    });
  });

  confirmCancelButtons.forEach((button) => {
    button.addEventListener("click", closeConfirmModal);
  });

  confirmAcceptButton?.addEventListener("click", () => {
    if (!pendingDeleteForm) {
      return;
    }

    const form = pendingDeleteForm;
    const secondMessage = form.dataset.confirmSecondMessage || "";

    if (!pendingDeleteSecondStage && secondMessage) {
      pendingDeleteSecondStage = true;
      pendingExtraCheckboxChecked = Boolean(confirmExtraCheckboxInput?.checked);
      confirmModalTitle.textContent = "Final Confirmation";
      confirmModalMessage.textContent = secondMessage;
      if (confirmExtraCheckbox) {
        confirmExtraCheckbox.hidden = true;
      }
      return;
    }

    const folderDeleteInput = form.querySelector("[data-confirm-folder-delete-input]");
    if (folderDeleteInput) {
      folderDeleteInput.checked = pendingDeleteSecondStage ? pendingExtraCheckboxChecked : Boolean(confirmExtraCheckboxInput?.checked);
    }

    closeConfirmModal();
    form.submit();
  });
}

const markdownHelpOpenButton = document.querySelector("[data-markdown-help-open]");
const markdownHelpModal = document.querySelector("[data-markdown-help-modal]");
const markdownHelpCloseButtons = Array.from(document.querySelectorAll("[data-markdown-help-close]"));

if (markdownHelpOpenButton && markdownHelpModal) {
  markdownHelpOpenButton.addEventListener("click", () => {
    markdownHelpModal.hidden = false;
  });

  markdownHelpCloseButtons.forEach((button) => {
    button.addEventListener("click", () => {
      markdownHelpModal.hidden = true;
    });
  });
}


























const copyButtons = Array.from(document.querySelectorAll("[data-copy-target]"));

copyButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    const sourceId = button.dataset.copyTarget;
    const source = document.querySelector(`[data-copy-source="${sourceId}"]`);
    if (!source) {
      return;
    }

    const text = source.value || source.textContent || "";
    try {
      await navigator.clipboard.writeText(text);
      const originalLabel = button.textContent;
      button.textContent = "Copied";
      window.setTimeout(() => {
        button.textContent = originalLabel;
      }, 1400);
    } catch (error) {
      source.focus();
      source.select?.();
    }
  });
});

const enableToggleInputs = Array.from(document.querySelectorAll("[data-enable-toggle-input]"));

enableToggleInputs.forEach((input) => {
  const root = input.closest("[data-enable-toggle]");
  const label = root?.querySelector("[data-enable-toggle-label]");
  const scope = input.closest("[data-enable-toggle-scope]");
  const controlledInputs = scope
    ? Array.from(scope.querySelectorAll("input, select, textarea, button"))
        .filter((controlledInput) => controlledInput !== input)
    : [];

  if (!label) {
    return;
  }

  const syncEnableToggleState = () => {
    const isEnabled = input.checked;
    label.textContent = isEnabled ? "Enabled" : "Enable";
    controlledInputs.forEach((controlledInput) => {
      controlledInput.disabled = !isEnabled;
    });
  };

  syncEnableToggleState();
  input.addEventListener("change", syncEnableToggleState);
});




