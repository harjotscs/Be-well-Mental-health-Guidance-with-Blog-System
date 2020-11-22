const mongoose = require("mongoose");
const validator = require("validator");

const questionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  answered: {
    type: Boolean,
    default: false,
    required: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error("Email is invalid");
      }
    },
  },
  date: {
    type: Date,
    default: new Date(),
  },
  contact: {
    type: Number,
    trim: true,
  },
  question: {
    type: String,
    required: true,
    trim: true,
  },
  reply: {
    type: String,
    trim: true,
  },
});

const Question = mongoose.model("question", questionSchema);

module.exports = Question;
