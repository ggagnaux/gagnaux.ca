const { randomUUID } = require("crypto");
const distributionService = require("../services/distributionService");
const linkedinAuthService = require("../services/linkedinAuthService");
const settingsService = require("../services/settingsService");

function boolValue(value) {
  return value ? "1" : "0";
}

function getActiveSettingsTab(value) {
  return ["details", "contact-links", "header-logo", "distribution"].includes(value) ? value : "details";
}

function getActiveDistributionTab(value, destinations = []) {
  const allowed = destinations.map((destination) => destination.destination_key);
  if (allowed.includes(value)) {
    return value;
  }

  return allowed[0] || "linkedin";
}

function renderSettings(req, res) {
  const distributionDestinations = distributionService.listDestinations();

  res.render("admin/settings/index", {
    pageTitle: "Settings",
    settings: settingsService.getSettingsObject(),
    distributionDestinations,
    linkedInAuth: linkedinAuthService.getAuthStatus(req),
    activeSettingsTab: getActiveSettingsTab(req.query.tab || "details"),
    activeDistributionTab: getActiveDistributionTab(req.query.distribution_tab, distributionDestinations)
  });
}

function updateSettings(req, res) {
  const elsewhereLinks = JSON.stringify(
    [
      { label: "Toji Studios", url: req.body.toji_url || "" },
      { label: "GitHub", url: req.body.github_url || "" },
      { label: "LinkedIn", url: req.body.linkedin_url || "" },
      { label: "Medium", url: req.body.medium_url || "" },
      { label: "Instagram", url: req.body.instagram_url || "" }
    ].filter((item) => item.url)
  );

  settingsService.updateSettings({
    site_title: req.body.site_title || "",
    site_url: req.body.site_url || "",
    site_descriptor: req.body.site_descriptor || "",
    logo_mode: req.body.logo_mode === "animated" ? "animated" : "static",
    logo_animation_mode: ["signal", "bars", "radar", "g-spin", "gg-dual-spin", "peek-face"].includes(req.body.logo_animation_mode)
      ? req.body.logo_animation_mode
      : "signal",
    logo_anim_background_color: req.body.logo_anim_background_color || "#000000",
    logo_anim_foreground_color: req.body.logo_anim_foreground_color || "#ffffff",
    logo_anim_speed_multiplier: req.body.logo_anim_speed_multiplier || "1",
    logo_anim_line_thickness: req.body.logo_anim_line_thickness || "2.4",
    logo_anim_glow_intensity: req.body.logo_anim_glow_intensity || "0.65",
    logo_signal_trace_speed: req.body.logo_signal_trace_speed || "1",
    logo_signal_amplitude: req.body.logo_signal_amplitude || "1",
    logo_signal_grid_enabled: boolValue(req.body.logo_signal_grid_enabled),
    logo_signal_grid_opacity: req.body.logo_signal_grid_opacity || "0.35",
    logo_bars_count: req.body.logo_bars_count || "22",
    logo_bars_speed: req.body.logo_bars_speed || "1",
    logo_bars_amplitude: req.body.logo_bars_amplitude || "1",
    logo_bars_bar_width: req.body.logo_bars_bar_width || "3.2",
    logo_radar_sweep_speed: req.body.logo_radar_sweep_speed || "1",
    logo_radar_trail_length: req.body.logo_radar_trail_length || "12",
    logo_radar_beam_width: req.body.logo_radar_beam_width || "4",
    logo_g_spin_text: req.body.logo_g_spin_text || "GG",
    logo_g_spin_font_size: req.body.logo_g_spin_font_size || "35",
    logo_g_spin_speed: req.body.logo_g_spin_speed || "1",
    logo_dual_font_size: req.body.logo_dual_font_size || "29",
    logo_dual_change_interval_min: req.body.logo_dual_change_interval_min || "45",
    logo_dual_change_interval_max: req.body.logo_dual_change_interval_max || "100",
    logo_dual_allow_vertical_axis: boolValue(req.body.logo_dual_allow_vertical_axis),
    logo_dual_allow_horizontal_axis: boolValue(req.body.logo_dual_allow_horizontal_axis),
    logo_face_color: req.body.logo_face_color || "#ffffff",
    logo_face_min_visible_frames: req.body.logo_face_min_visible_frames || "1800",
    logo_face_half_peek_probability: req.body.logo_face_half_peek_probability || "0.22",
    logo_face_hat_probability: req.body.logo_face_hat_probability || "0.32",
    logo_face_talk_probability: req.body.logo_face_talk_probability || "0.42",
    logo_face_blink_mode_probability: req.body.logo_face_blink_mode_probability || "0.18",
    hero_headline: req.body.hero_headline || "",
    hero_supporting_text: req.body.hero_supporting_text || "",
    hero_primary_label: req.body.hero_primary_label || "",
    hero_primary_link: req.body.hero_primary_link || "",
    hero_secondary_label: req.body.hero_secondary_label || "",
    hero_secondary_link: req.body.hero_secondary_link || "",
    hero_text_link_label: req.body.hero_text_link_label || "",
    hero_text_link: req.body.hero_text_link || "",
    footer_copy: req.body.footer_copy || "",
    footer_tagline: req.body.footer_tagline || "",
    about_intro: req.body.about_intro || "",
    about_body: req.body.about_body || "",
    contact_body: req.body.contact_body || "",
    contact_email: req.body.contact_email || "",
    elsewhere_links: elsewhereLinks
  });

  distributionService.updateDestinations(req.body);

  const updatedSettings = settingsService.getSettingsObject();
  const distributionDestinations = distributionService.listDestinations();

  res.locals.siteSettings = updatedSettings;
  res.locals.flashMessage = "Settings updated.";

  res.render("admin/settings/index", {
    pageTitle: "Settings",
    settings: updatedSettings,
    distributionDestinations,
    linkedInAuth: linkedinAuthService.getAuthStatus(req),
    activeSettingsTab: getActiveSettingsTab(req.body.active_settings_tab || "details"),
    activeDistributionTab: getActiveDistributionTab(req.body.active_distribution_tab, distributionDestinations)
  });
}

function connectLinkedIn(req, res) {
  const config = linkedinAuthService.getConfig(req);
  if (!config.isConfigured) {
    req.session.flashMessage = "Add LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, and a valid LinkedIn redirect URI before connecting.";
    return res.redirect("/admin/settings?tab=distribution&distribution_tab=linkedin");
  }

  const state = randomUUID();
  req.session.linkedinOAuthState = state;
  return res.redirect(linkedinAuthService.buildAuthorizationUrl(req, state));
}

async function handleLinkedInCallback(req, res, next) {
  try {
    const expectedState = req.session.linkedinOAuthState;
    delete req.session.linkedinOAuthState;

    if (req.query.error) {
      req.session.flashMessage = `LinkedIn authorization failed: ${req.query.error_description || req.query.error}`;
      return res.redirect("/admin/settings?tab=distribution&distribution_tab=linkedin");
    }

    if (!expectedState || req.query.state !== expectedState) {
      req.session.flashMessage = "LinkedIn authorization could not be verified. Please try again.";
      return res.redirect("/admin/settings?tab=distribution&distribution_tab=linkedin");
    }

    if (!req.query.code) {
      req.session.flashMessage = "LinkedIn did not return an authorization code.";
      return res.redirect("/admin/settings?tab=distribution&distribution_tab=linkedin");
    }

    const tokenPayload = await linkedinAuthService.exchangeCodeForToken(req, req.query.code);
    linkedinAuthService.saveConnection(tokenPayload);

    req.session.flashMessage = "LinkedIn is now connected.";
    return res.redirect("/admin/settings?tab=distribution&distribution_tab=linkedin");
  } catch (error) {
    return next(error);
  }
}

function disconnectLinkedIn(req, res) {
  linkedinAuthService.clearConnection();
  req.session.flashMessage = "LinkedIn connection removed.";
  return res.redirect("/admin/settings?tab=distribution&distribution_tab=linkedin");
}

module.exports = {
  renderSettings,
  updateSettings,
  connectLinkedIn,
  handleLinkedInCallback,
  disconnectLinkedIn
};





