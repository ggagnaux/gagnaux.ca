require("dotenv").config();
const { ensureDatabase } = require("../src/config/database");

ensureDatabase();

console.log("Database initialized.");
