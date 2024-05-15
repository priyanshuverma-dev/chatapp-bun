import { Server, Socket } from "socket.io";
import http from "http";
import { getUser, signIn, signUp } from "./users/index";
import { authMiddleware } from "./middleware/auth";
import express, { Request, Response } from "express";
import cors from "cors";
import path from "path";
import { verify } from "jsonwebtoken";
import db from "./lib/db";

const app = express();
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

const io = new Server(server);
const connections = new Set();

app.use(cors());
app.use("/user/*", authMiddleware);

app.use(express.static(path.join(__dirname, "public")));

app.post("/auth/signup", signUp);
app.post("/auth/signin", signIn);

app.get("/user/me", getUser);

io.use((socket, next) => {
  const token = socket.handshake.query.token as string;

  if (!token) {
    return next(new Error("Unauthorized"));
  }

  try {
    const payload = verify(token, process.env.JWT_SECRET!, {
      algorithms: ["HS256"],
    });

    socket.data.userId = (payload as any).userId as string;
    next();
  } catch (error) {
    console.log(`[ERROR] ${error}`);
    return next(new Error("Unauthorized"));
  }
});

io.on("connection", onConnected);

server.listen(PORT, () => {
  console.log(`☁ Server running at http://localhost:${PORT}`);
});

function onConnected(socket: Socket) {
  if (!socket.data.userId) {
    return new Error("Unauthorized");
  }

  console.log("Socket connected", socket.data.userId);

  console.log("Socket connected", socket.id);
  connections.add(socket.id);
  io.emit("clients-total", connections.size);

  socket.on("disconnect", () => {
    console.log("Socket disconnected", socket.id);
    connections.delete(socket.id);
    io.emit("clients-total", connections.size);
  });

  socket.on("message", async (data) => {
    socket.broadcast.emit("chat-message", data);
    await db.message.create({
      data: {
        text: data.message,
        userId: socket.data.userId,
        recieverId: data.recieverId,
      },
    });
  });

  socket.on("feedback", (data) => {
    socket.broadcast.emit("feedback", data);
  });
}
