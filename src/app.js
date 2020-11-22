const express = require("express");
const hbs = require("hbs");
const path = require("path");
const passport = require("passport");
const { Socket } = require("socket.io");
const { v4: uuidV4 } = require("uuid");

require("./db/mongoose");

const userRouter = require("./routers/user");
const blogRouter = require("./routers/blog");
const linkRouter = require("./routers/links");

const initialiizePassport = require("./utils/passport-config");
initialiizePassport(passport);

const publicDirectoryPath = path.join(__dirname, "../public");
const partialsDirectoryPath = path.join(__dirname, "../views/partials");

const app = express();

const server = require("http").Server(app);
const io = require("socket.io")(server);

hbs.registerPartials(partialsDirectoryPath);
hbs.registerHelper("paginate", require("handlebars-paginate"));

app.use(express.static(publicDirectoryPath));
app.use(userRouter);
app.use(blogRouter);
app.use(linkRouter);

app.set("view engine", "hbs");

const port = process.env.PORT;

app.get("/room", (req, res) => {
  res.redirect(`/room/${uuidV4()}`);
});

app.get("/room/:room", (req, res) => {
  res.render("room", {
    roomId: req.params.room,
  });
});

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).broadcast.emit("user-connected", userId);
    socket.on("disconnect", () => {
      socket.to(roomId).broadcast.emit("user-disconnected", userId);
    });
  });
});

server.listen(port, () => {
  console.log(`Server Up and runing on Port: http://localhost:${port}`);
});
