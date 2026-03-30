const bcrypt = require("bcrypt");
const { getDb } = require("../config/database");

function renderLogin(req, res) {
  if (req.session?.user) {
    return res.redirect("/admin");
  }

  return res.render("admin/login", {
    pageTitle: "Admin Login",
    errorMessage: null
  });
}

function login(req, res) {
  const { username, password } = req.body;
  const user = getDb().prepare("SELECT * FROM users WHERE username = ?").get(username);

  if (!user || !bcrypt.compareSync(password || "", user.password_hash)) {
    return res.status(401).render("admin/login", {
      pageTitle: "Admin Login",
      errorMessage: "Invalid username or password."
    });
  }

  req.session.user = {
    id: user.id,
    username: user.username
  };
  req.session.flashMessage = "Signed in.";
  return res.redirect("/admin");
}

function logout(req, res) {
  req.session = null;
  res.redirect("/admin/login");
}

module.exports = {
  renderLogin,
  login,
  logout
};
