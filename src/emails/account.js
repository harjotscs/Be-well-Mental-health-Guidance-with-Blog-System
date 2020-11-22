const nodemailer = require("nodemailer");
const { v4: uuidV4 } = require("uuid");

let transporter = nodemailer.createTransport({
  host: "smtp-relay.sendinblue.com",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const welcomeEmail = async (email, name, token) => {
  let info = await transporter.sendMail({
    from: process.env.EMAIL,
    to: email,
    subject: `Welcome ${name}`,
    text: `Hi ${name}, Please click On ${process.env.HOST}/verification/${token} To Verify Your Account Alternatively You can Copy Paste The Link In Your Browser `, // plain text body
    // html: "<b>Hello world?</b>"
  });

  console.log("Message sent: %s", info.messageId);
};

const verifyEmail = async (email, subject, name, message, token) => {
  let info = await transporter.sendMail({
    from: process.env.EMAIL,
    to: email,
    subject: subject,
    text: `Hi ${name}, As You ${message}, You Need To Verify That This E-Mail Belongs To ${name}, So Please click On ${process.env.HOST}/verification/${token} To Verify Your E-Mail Alternatively You can Copy Paste The Link In Your Browser `, // plain text body
    // html: "<b>Hello world?</b>"
  });

  console.log("Message sent: %s", info.messageId);
};

const answerEmail = async (email, name, id) => {
  let info = await transporter.sendMail({
    from: process.env.EMAIL,
    to: email,
    subject: `Hi ${name}`,
    text: `Hi ${name}, Your Question is Answered Please click On ${process.env.HOST}/answer/${id} To read your answer Alternatively You can Copy Paste The Link In Your Browser `, // plain text body
    // html: "<b>Hello world?</b>"
  });

  console.log("Message sent: %s", info.messageId);
};

const resetEmail = async (email, name, token) => {
  let info = await transporter.sendMail({
    from: process.env.EMAIL,
    to: email,
    subject: "Forgot Password",
    text: `Hi ${name}, As You Have Forgot Your Password You Need To Verify That This E-Mail Belongs To ${name}, So Please click On ${process.env.HOST}/reset/${token} To Verify That You Opted To Reset Your Password Alternatively You can Copy Paste The Link In Your Browser,In Case You Didn't Opted To Reset Your Password  In Case You Didn't Opted Just Ignore This Email Nothing Has Been Changed With Your Account`, // plain text body
    // html: "<b>Hello world?</b>"
  });

  console.log("Message sent: %s", info.messageId);
};

const goodByeEmail = async (email, name) => {
  let info = await transporter.sendMail({
    from: "coderharjot@gmail.com",
    to: email,
    subject: `Good Bye ${name}`,
    text: `Hi ${name}, I Loved that You Spent a Lot of time with this app this is last email to tell you that your account is cancelled as per your request `, // plain text body
    // html: "<b>Hello world?</b>"
  });

  console.log("Message sent: %s", info.messageId);
};

const roomEmail = async (email, name, date, time) => {
  const token = uuidV4();
  let info = await transporter.sendMail({
    from: process.env.EMAIL,
    to: email,
    subject: "Video Conferencing Details",
    text: `Hi ${name}, As You Have Opted for video counselling so we have booked a counselling room as per date and time asked by you here is your counselling room link ${process.env.HOST}/room/${token} and your counselling is on ${date} ${time}`, // plain text body
    // html: "<b>Hello world?</b>"
  });

  console.log("Message sent: %s", info.messageId);
};

module.exports = {
  welcomeEmail,
  goodByeEmail,
  verifyEmail,
  answerEmail,
  resetEmail,
  roomEmail,
};
