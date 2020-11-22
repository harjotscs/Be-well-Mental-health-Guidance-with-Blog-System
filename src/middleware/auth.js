const auth = (req, res, next) => {
  if (
    req.isAuthenticated() &&
    req.user.isDoctor === true &&
    req.user.isApproved === true
  ) {
    return next();
  } else if (
    req.isAuthenticated() &&
    req.user.isDoctor === true &&
    req.user.isApproved === false
  ) {
    req.logOut();
    res.render("certificateUpload", {
      message: "Please Wait Until Your Certificate Is Attested",
    });
  } else if (req.isAuthenticated() && req.user.isVerified) {
    return res.render("question", {
      user: req.user,
    });
  } else {
    res.redirect("/login");
  }
};

const cAuth = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
};

const adminAuth = (req, res, next) => {
  if (req.isAuthenticated() && req.user.isAdmin === true) {
    return next();
  } else if (req.isAuthenticated() && req.user.isVerified) {
    return res.render("question", {
      user: req.user,
    });
  }
  res.redirect("/login");
};

const notauth = (req, res, next) => {
  if (req.isAuthenticated()) {
    return res.redirect("/admin/blog");
  }
  return next();
};

module.exports = {
  auth,
  notauth,
  adminAuth,
  cAuth,
};
