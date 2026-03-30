const bcrypt = require("bcrypt");
const { DateTime } = require("luxon");

const { getDb } = require("../config/database");
const { normalizeText } = require("../utils/formatters");

function getUserById(id) {
  return getDb().prepare("SELECT * FROM users WHERE id = ?").get(id);
}

function getUserByUsername(username) {
  const normalizedUsername = normalizeText(username);
  return getDb().prepare("SELECT * FROM users WHERE username = ?").get(normalizedUsername);
}

function updateUserCredentials(id, { username, password }) {
  const normalizedUsername = normalizeText(username);
  const timestamp = DateTime.now().toISO();

  if (password) {
    const passwordHash = bcrypt.hashSync(password, 10);
    getDb()
      .prepare("UPDATE users SET username = ?, password_hash = ?, updated_at = ? WHERE id = ?")
      .run(normalizedUsername, passwordHash, timestamp, id);
  } else {
    getDb()
      .prepare("UPDATE users SET username = ?, updated_at = ? WHERE id = ?")
      .run(normalizedUsername, timestamp, id);
  }

  return getUserById(id);
}

module.exports = {
  getUserById,
  getUserByUsername,
  updateUserCredentials
};