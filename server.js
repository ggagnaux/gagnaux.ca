require("dotenv/config");
const app = require("./src/app");
const { ensureDatabase } = require("./src/config/database");

const port = Number(process.env.PORT || 3000);

ensureDatabase();

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});

