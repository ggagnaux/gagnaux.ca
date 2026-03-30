const bcrypt = require("bcrypt");

const userService = require("../services/userService");
const { normalizeText } = require("../utils/formatters");

function buildFormValues(user, values = {}) {
  return {
    username: Object.prototype.hasOwnProperty.call(values, "username")
      ? values.username
      : user?.username || ""
  };
}

function renderSecurityPage(res, { user, formValues, errorMessage = null, statusCode = 200 }) {
  return res.status(statusCode).render("admin/security/index", {
    pageTitle: "Security",
    errorMessage,
    formValues: buildFormValues(user, formValues)
  });
}

function renderSecurity(req, res) {
  const user = userService.getUserById(req.session.user.id);

  if (!user) {
    req.session = null;
    return res.redirect("/admin/login");
  }

  return renderSecurityPage(res, { user });
}

function updateSecurity(req, res) {
  const user = userService.getUserById(req.session.user.id);

  if (!user) {
    req.session = null;
    return res.redirect("/admin/login");
  }

  const username = normalizeText(req.body.username);
  const currentPassword = req.body.current_password || "";
  const newPassword = req.body.new_password || "";
  const confirmNewPassword = req.body.confirm_new_password || "";
  const hasUsernameChange = username !== user.username;
  const hasPasswordChange = Boolean(newPassword || confirmNewPassword);

  if (!username) {
    return renderSecurityPage(res, {
      user,
      formValues: { username },
      errorMessage: "Username is required.",
      statusCode: 400
    });
  }

  if (!currentPassword) {
    return renderSecurityPage(res, {
      user,
      formValues: { username },
      errorMessage: "Current password is required to save security changes.",
      statusCode: 400
    });
  }

  if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
    return renderSecurityPage(res, {
      user,
      formValues: { username },
      errorMessage: "Current password is incorrect.",
      statusCode: 400
    });
  }

  if (!hasUsernameChange && !hasPasswordChange) {
    return renderSecurityPage(res, {
      user,
      formValues: { username },
      errorMessage: "No security changes to save.",
      statusCode: 400
    });
  }

  if (hasUsernameChange) {
    const existingUser = userService.getUserByUsername(username);

    if (existingUser && existingUser.id !== user.id) {
      return renderSecurityPage(res, {
        user,
        formValues: { username },
        errorMessage: "That username is already in use.",
        statusCode: 400
      });
    }
  }

  if (hasPasswordChange && !newPassword) {
    return renderSecurityPage(res, {
      user,
      formValues: { username },
      errorMessage: "Enter a new password to update your password.",
      statusCode: 400
    });
  }

  if (hasPasswordChange && newPassword !== confirmNewPassword) {
    return renderSecurityPage(res, {
      user,
      formValues: { username },
      errorMessage: "New password and confirmation must match.",
      statusCode: 400
    });
  }

  const updatedUser = userService.updateUserCredentials(user.id, {
    username,
    password: hasPasswordChange ? newPassword : null
  });

  req.session.user = {
    id: updatedUser.id,
    username: updatedUser.username
  };
  req.session.flashMessage = "Security settings updated.";

  return res.redirect("/admin/security");
}

module.exports = {
  renderSecurity,
  updateSecurity
};
