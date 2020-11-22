const express = require("express");
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
const methodOverride = require("method-override");
const bodyParser = require("body-parser");
const shortid = require("shortid");
const bcrypt = require("bcrypt");
const morgan = require("morgan");
const multer = require("multer");

const User = require("../models/user");
const Blog = require("../models/post");
const Category = require("../models/category");

const {
  welcomeEmail,
  verifyEmail,
  resetEmail,
  roomEmail,
} = require("../emails/account");
const { auth, notauth, adminAuth, cAuth } = require("../middleware/auth");

const router = express.Router();

router.use(bodyParser.json({ limit: "50mb" }));
router.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
router.use(methodOverride("_method"));
router.use(flash());
router.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
router.use(passport.initialize());
router.use(passport.session());
router.use(morgan("dev"));

router.get("/user/me", auth, async (req, res) => {
  const user = req.user;
  const totalPosts = await Blog.find({ authId: user._id }).countDocuments();
  res.render("profile", {
    user,
    totalPosts,
  });
});

router.get("/user/password", auth, (req, res) => {
  const user = req.user;
  res.render("changePassword", {
    pageTitle: "Change Password",
    user,
  });
});

router.get("/user/edit", auth, async (req, res) => {
  const user = req.user;
  res.render("userEdit", {
    user,
  });
});

router.get("/user/forgot", async (req, res) => {
  res.render("forgot");
});

router.get("/reset/:token", async (req, res) => {
  const user = await User.findOne({ token: req.params.token });
  if (!user) {
    return res.render("verification", {
      message: "INVALID ATTEMPT",
    });
  } else {
    res.render("reset", {
      user,
    });
  }
});

router.get("/users", auth, async (req, res) => {
  try {
    user = req.user;
    if (user.isAdmin === true) {
      const userList = await User.find({}).sort({ name: 1 });

      res.render("verification", {
        user,
        userList,
        pageTitle: "Users",
      });
    } else {
      res.redirect("/admin/blog");
    }
  } catch (e) {
    console.log(e);
    res.render("verification", {
      message: "Something Went Wrong",
      user,
    });
  }
});

router.get("/signup", notauth, async (req, res) => {
  const categories = await Category.find({}).sort({ category: 1 });
  res.render("signup", {
    categories,
  });
});

router.get("/login", notauth, (req, res) => {
  res.render("login");
});

router.get("/verification/:token", async (req, res) => {
  const user = await User.findOne({ token: req.params.token });
  if (!user) {
    return res.render("verification", {
      message: "INVALID ATTEMPT",
    });
  } else {
    user.token = undefined;
    user.isVerified = true;
    await user.save();
    if (user.isDoctor && user.isApproved) {
      return res.render("verification", {
        login: "/login",
        message: "Verified Successfully",
      });
    }
    if (user.isDoctor) {
      user.token = req.params.token;
      await user.save();
      return res.render("certificateUpload", {
        token: user.token,
        pending: true,
      });
    }
    res.render("verification", {
      message: "Verified",
      login: "/login",
    });
  }
});

router.get("/logout", auth, (req, res) => {
  req.logOut();
  res.redirect("/login");
});

router.get("/user/pending", adminAuth, async (req, res) => {
  const userList = await User.find({ isDoctor: true, isApproved: false });
  userList.length === 0
    ? (message = "No Pending Doctor To Approve")
    : (message = null);
  res.render("approveDoctor", {
    userList,
    message,
    user: req.user,
  });
});

router.get("/user/approve/:email", adminAuth, async (req, res) => {
  const user = await User.findOne({ email: req.params.email });
  user.isApproved = true;
  await user.save();
  const userList = await User.find({ isDoctor: true, isApproved: false });
  res.render("approveDoctor", {
    message: "Approved",
    userList,
    user: req.user,
  });
});

router.get("/user/reject/:email", adminAuth, async (req, res) => {
  const user = await User.findOne({ email: req.params.email });
  user.isDoctor = false;
  await user.save();
  const userList = await User.find({ isDoctor: true, isApproved: false });
  res.render("approveDoctor", {
    message: "Rejected",
    userList,
    user: req.user,
  });
});

router.post("/signup", async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const user = new User(req.body);
    user.token = shortid.generate();
    if (userCount === 0) {
      user.isAdmin = true;
      user.isDoctor = true;
      user.isApproved = true;
    } else {
      user.isAdmin = undefined;
    }
    await user.save();
    welcomeEmail(user.email, user.name, user.token);
    res.render("verification", {
      message: "Please Check Your Email To Verify Your Account",
    });
  } catch (e) {
    console.log(e);
    if (e.code === 11000) {
      req.flash("info", "Email Already Associated With Another Account");
      return res.redirect("/signup");
    }
    req.flash("info", "Something Went Wrong");
    res.redirect("/signup");
  }
});

router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/admin/blog",
    failureRedirect: "/login",
    failureFlash: true,
  })
);

router.post("/user/forgot", notauth, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      req.flash("info", `No User Associated With ${req.body.email}`);
      return res.redirect("/user/forgot");
    }
    const token = shortid.generate();
    await User.findByIdAndUpdate({ _id: user._id }, { token });
    resetEmail(user.email, user.name, token);
    res.render("verification", {
      pageTitle: "Forgot Password",
      message: "Please Check Your E-mail For Further Details",
    });
  } catch (e) {
    req.flash("info", "Something Went Wrong");
    res.redirect("/user/forgot");
  }
});

router.post("/user/password", auth, async (req, res) => {
  const user = req.user;
  const userData = await User.findById({ _id: user._id });
  if (
    (await bcrypt.compare(req.body.currentPassword, userData.password)) ===
    false
  ) {
    req.flash("info", "Current Password Doesn't Match");
    return res.render("changePassword", {
      pageTitle: "Change Password",
      user,
    });
  }
  userData.password = req.body.password;
  await userData.save();
  res.render("changePassword", {
    pageTitle: "Password Changed",
    user,
    message: "Password Changed Successfully",
  });
});

router.patch("/user/edit", auth, async (req, res) => {
  try {
    const user = req.user;
    if (user.email != req.body.email) {
      var token = shortid.generate();
      const subject = "Updated Your E-mail";
      await User.findByIdAndUpdate(
        { _id: user._id },
        {
          name: req.body.name,
          email: req.body.email,
          isVerified: false,
          token,
        }
      );

      var subjectEmail = "Verify Your New E-Mail";
      var messageEmail = "Updated Your E-mail";

      verifyEmail(
        req.body.email,
        subjectEmail,
        req.body.name,
        messageEmail,
        token
      );

      return res.render("verification", {
        pageTitle: "Updated",
        message:
          "Profile Updated Successfully, Make Sure To Verify Your New Email Within 24 Hours Otherwise Your Account Will Be Deleted",
        user,
      });
    }
    await User.findByIdAndUpdate(
      { _id: user._id },
      {
        name: req.body.name,
        email: req.body.email,
      }
    );
    res.render("verification", {
      pageTitle: "Updated",
      message: "Profile Updated Successfully",
      user,
    });
  } catch (e) {
    console.log(e);
    if (e.code === 11000) {
      req.flash("info", "Email Already Associated With Another Account");
      return res.redirect("/user/edit");
    }
    req.flash("info", "Something Went Wrong");
    res.redirect("/user/edit");
  }
});

router.post("/user/reset", async (req, res) => {
  try {
    const user = await User.findById({ _id: req.body.id });
    user.password = req.body.password;
    user.token = undefined;
    await user.save();

    res.render("verification", {
      pageTitle: "Password Changed",
      message: "Password Changed Successfully",
      login: "/login",
    });
  } catch (e) {
    console.log(e);
    req.flash("info", "Something Went Wrong");
    res.render("verification");
  }
});

const upload = multer({
  limits: {
    fileSize: 1000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpeg|jpg|png)$/)) {
      cb(new Error("Please upload either a .png, .jpg or .jpeg type Image"));
    }
    cb(undefined, true);
  },
});

router.post(
  "/user/certificateUpload",
  upload.single("certificate"),
  async (req, res) => {
    var user = await User.findOne({ token: req.body.token });
    user.token = undefined;
    const buffer = req.file.buffer;
    user.certificate = buffer.toString("base64");
    await user.save();
    res.render("certificateUpload", {
      message:
        "The Admin will attest your certificate and approve your Account Soon",
    });
  }
);

router.post("/generate/room", cAuth, (req, res) => {
  roomEmail(req.body.email, req.body.name, req.body.date, req.body.time);
  res.render("certificateUpload", {
    message: "You'll receive an email soon",
  });
});

module.exports = router;
