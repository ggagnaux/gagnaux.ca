const { DateTime } = require("luxon");
const { getDb } = require("../config/database");
const { parseJsonSetting } = require("../utils/content");

function getAllSettings() {
  return getDb()
    .prepare("SELECT * FROM settings ORDER BY setting_key ASC")
    .all();
}

function parseInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function parseFloatValue(value, fallback) {
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function parseBoolean(value, fallback) {
  if (value === "1" || value === 1 || value === true) {
    return true;
  }

  if (value === "0" || value === 0 || value === false) {
    return false;
  }

  return fallback;
}

function getSettingsObject() {
  const settings = getAllSettings();
  const map = {};

  settings.forEach((item) => {
    map[item.setting_key] = item.setting_value;
  });

  map.elsewhere_links_parsed = parseJsonSetting(map.elsewhere_links || "[]", []);
  map.logo_animation_settings = {
    shared: {
      backgroundColor: map.logo_anim_background_color || "#000000",
      foregroundColor: map.logo_anim_foreground_color || "#ffffff",
      speedMultiplier: parseFloatValue(map.logo_anim_speed_multiplier, 1),
      lineThickness: parseFloatValue(map.logo_anim_line_thickness, 2.4),
      glowIntensity: parseFloatValue(map.logo_anim_glow_intensity, 0.65)
    },
    signal: {
      traceSpeed: parseFloatValue(map.logo_signal_trace_speed, 1),
      amplitude: parseFloatValue(map.logo_signal_amplitude, 1),
      gridEnabled: parseBoolean(map.logo_signal_grid_enabled, true),
      gridOpacity: parseFloatValue(map.logo_signal_grid_opacity, 0.35)
    },
    bars: {
      count: parseInteger(map.logo_bars_count, 22),
      speed: parseFloatValue(map.logo_bars_speed, 1),
      amplitude: parseFloatValue(map.logo_bars_amplitude, 1),
      barWidth: parseFloatValue(map.logo_bars_bar_width, 3.2)
    },
    radar: {
      sweepSpeed: parseFloatValue(map.logo_radar_sweep_speed, 1),
      trailLength: parseInteger(map.logo_radar_trail_length, 12),
      beamWidth: parseFloatValue(map.logo_radar_beam_width, 4)
    },
    gSpin: {
      text: map.logo_g_spin_text || "GG",
      fontSize: parseInteger(map.logo_g_spin_font_size, 35),
      speed: parseFloatValue(map.logo_g_spin_speed, 1)
    },
    dual: {
      fontSize: parseInteger(map.logo_dual_font_size, 29),
      changeIntervalMin: parseInteger(map.logo_dual_change_interval_min, 45),
      changeIntervalMax: parseInteger(map.logo_dual_change_interval_max, 100),
      allowVerticalAxis: parseBoolean(map.logo_dual_allow_vertical_axis, true),
      allowHorizontalAxis: parseBoolean(map.logo_dual_allow_horizontal_axis, true)
    },
    face: {
      color: map.logo_face_color || "#ffffff",
      minVisibleFrames: parseInteger(map.logo_face_min_visible_frames, 1800),
      halfPeekProbability: parseFloatValue(map.logo_face_half_peek_probability, 0.22),
      hatProbability: parseFloatValue(map.logo_face_hat_probability, 0.32),
      talkProbability: parseFloatValue(map.logo_face_talk_probability, 0.42),
      blinkModeProbability: parseFloatValue(map.logo_face_blink_mode_probability, 0.18)
    }
  };
  map.logo_animation_settings_json = JSON.stringify(map.logo_animation_settings);
  return map;
}

function upsertSettings(input) {
  const database = getDb();
  const statement = database.prepare(
    `INSERT INTO settings (setting_key, setting_value, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(setting_key) DO UPDATE SET
       setting_value = excluded.setting_value,
       updated_at = excluded.updated_at`
  );
  const timestamp = DateTime.now().toISO();

  Object.entries(input).forEach(([key, value]) => {
    statement.run(key, value, timestamp);
  });
}

function updateSettings(input) {
  upsertSettings(input);
}

module.exports = {
  getAllSettings,
  getSettingsObject,
  upsertSettings,
  updateSettings
};
