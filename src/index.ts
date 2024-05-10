import { Server, Socket } from "socket.io";
import http from "http";
import { getUser, signIn, signUp } from "./users/index";
import { authMiddleware } from "./middleware/auth";
import express, { Request, Response } from "express";
import cors from "cors";
import path from "path";

const app = express();
const port = process.env.PORT || 3000;
const server = http.createServer(app);

const io = new Server(server);
const connections = new Set();

app.use(cors());
app.use("/user/*", authMiddleware);

app.use(express.static(path.join(__dirname, "public")));

app.post("/auth/signup", signUp);
app.post("/auth/signin", signIn);

app.get("/user/me", getUser);

io.on("connection", onConnected);

server.listen(port, () => {
  console.log(`☁ Server running at http://localhost:${port}`);
});

function onConnected(socket: Socket) {
  console.log("Socket connected", socket.id);
  connections.add(socket.id);
  io.emit("clients-total", connections.size);

  socket.on("disconnect", () => {
    console.log("Socket disconnected", socket.id);
    connections.delete(socket.id);
    io.emit("clients-total", connections.size);
  });

  socket.on("message", (data) => {
    // console.log(data)
    socket.broadcast.emit("chat-message", data);
  });

  socket.on("feedback", (data) => {
    socket.broadcast.emit("feedback", data);
  });
}
