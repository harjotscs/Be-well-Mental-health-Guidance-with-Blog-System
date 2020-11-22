const express = require("express");
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
const methodOverride = require("method-override");
const bodyParser = require("body-parser");
const shortid = require("shortid");
const bcrypt = require("bcrypt");
const morgan = require("morgan");

const User = require("../models/user");
const Blog = require("../models/post");
const Category = require("../models/category");

const {
  welcomeEmail,
  verifyEmail,
  resetEmail,
  answerEmail,
} = require("../emails/account");
const { auth, adminAuth, cAuth, notauth } = require("../middleware/auth");
const Question = require("../models/question");

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

router.get("/", (req, res) => {
  res.render("index");
});

router.get("/about", (req, res) => {
  res.render("about");
});

router.get("/services", (req, res) => {
  res.render("services");
});

router.get("/sblog", (req, res) => {
  res.render("sblog");
});

router.get("/contact", (req, res) => {
  res.render("contact");
});

router.get("/user/question", cAuth, async (req, res) => {
  res.render("question.hbs", {
    user: req.user,
  });
});

router.get("/question/:id", auth, async (req, res) => {
  const user = await Question.findOne({ _id: req.params.id });
  const currentUser = req.user;
  res.render("question", {
    user,
    currentUser,
  });
});

router.get("/dashboard", auth, async (req, res) => {
  const questions = await Question.find({ answered: false });
  res.render("dashboard", {
    user: req.user,
    questions,
  });
});

router.post("/user/question", cAuth, async (req, res) => {
  const question = new Question(req.body);
  await question.save();
  req.logOut();
  res.render("verification", {
    message:
      "Question Sent To Doctors As Soon As Any Of Our Doctor Answers It You Will Recieve An E-mail",
  });
});

router.post("/question/:id", auth, async (req, res) => {
  const question = await Question.findOne({ _id: req.params.id });
  question.answered = true;
  question.reply = req.body.reply;
  await question.save();
  const user = await User.findById({ _id: req.user._id });
  user.questionsAnswered += 1;
  await user.save();
  answerEmail(question.email, question.name, question._id);
  res.redirect("/dashboard");
});

router.get("/answer/:id", cAuth, async (req, res) => {
  const question = await Question.findOne({ _id: req.params.id });
  const user = question;

  res.render("question", {
    question,
    user,
  });
});

module.exports = router;
