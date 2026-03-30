const path = require("path");
const express = require("express");
const cookieSession = require("cookie-session");
const fileUpload = require("express-fileupload");
const nunjucks = require("nunjucks");
const { DateTime } = require("luxon");

const { attachLocals } = require("./middleware/locals");
const publicRoutes = require("./routes/public");
const adminRoutes = require("./routes/admin");

const app = express();
const isProduction = process.env.NODE_ENV === "production";

const env = nunjucks.configure(path.join(__dirname, "..", "views"), {
  autoescape: true,
  express: app,
  watch: false
});

env.addFilter("date", (value) => {
  if (!value) {
    return "";
  }

  return DateTime.fromISO(value).toLocaleString(DateTime.DATE_MED);
});

app.set("view engine", "njk");
app.set("views", path.join(__dirname, "..", "views"));

if (isProduction) {
  app.set("trust proxy", 1);
}

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  fileUpload({
    createParentPath: true,
    limits: {
      fileSize: 8 * 1024 * 1024
    },
    abortOnLimit: true
  })
);
app.use(
  cookieSession({
    name: "session",
    keys: [process.env.SESSION_SECRET || "change-this-session-secret"],
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    maxAge: 1000 * 60 * 60 * 8
  })
);
app.use("/vendor/p5", express.static(path.join(__dirname, "..", "node_modules", "p5", "lib")));
app.use("/uploads", express.static(path.join(__dirname, "..", "public", "uploads"), { dotfiles: "allow" }));
app.use(express.static(path.join(__dirname, "..", "public")));
app.use(attachLocals);

app.use("/", publicRoutes);
app.use("/admin", adminRoutes);

app.use((req, res) => {
  res.status(404).render("public/404", {
    pageTitle: "Not Found"
  });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).render("public/500", {
    pageTitle: "Server Error",
    errorMessage: isProduction ? null : error.message
  });
});

module.exports = app;
