import express from "express";
import cors from "cors";

import notFoundHandler from "./middlewares/notFoundHandler.js";
import errorHandler from "./middlewares/errorHandler.js";

import authRouter from "./routers/auth.router.js";
import usersRouter from "./routers/users.router.js";
import uploadRouter from "./routers/upload.router.js";
import postRouter from './routers/post.router.js';
import likeRouter from './routers/like.router.js';
import commentLikeRouter from "./routers/commentlike.router.js";
import commentRouter from './routers/comment.router.js';
import followRouter from './routers/follow.router.js';
import messageRouter from './routers/message.router.js';
import notificationRouter from './routers/notification.router.js';

import http from "http";
import { Server as IOServer } from "socket.io";

import Message from "./db/Message.js";
import mongoose from "mongoose";
const { ObjectId } = mongoose.Types;

import { setIo, addUserSocket, removeUserSocket } from "./sockets/socketService.js";

const startServer = () => {
  const app = express();

  // Мидлвары
  app.use(cors());
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ limit: "10mb", extended: true }));

  // Роуты
  app.use("/api/auth", authRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/upload", uploadRouter);
  app.use('/api/posts', postRouter);
  app.use("/api/likes", likeRouter);
  app.use("/api/comment-likes", commentLikeRouter);
  app.use("/api/comments", commentRouter);
  app.use("/api/follow", followRouter);
  app.use("/api/messages", messageRouter);
  app.use("/api/notifications", notificationRouter);

  // Error handlers
  app.use(notFoundHandler);
  app.use(errorHandler);

  // Создаем HTTP сервер на базе Express
  const httpServer = http.createServer(app);

  // Создаем Socket.IO сервер
  const io = new IOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  setIo(io);

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on("join", (userId) => {
      if (!userId) return;
      addUserSocket(userId, socket.id);
      socket.join(`user:${userId}`);
      socket.data.userId = userId;
    });

    socket.on("send_message", async (payload) => {
      try {
        const fromId = socket.data.userId;
        if (!fromId) return;

        const { to, text, conversationId } = payload;
        if (!to || !text || !conversationId) return;
        if (!mongoose.Types.ObjectId.isValid(conversationId)) return;

        const message = await Message.create({
          conversationId: new ObjectId(conversationId),
          from: new ObjectId(fromId),
          to: new ObjectId(to),
          text,
        });

        const populated = await Message.findById(message._id)
          .populate('from', '_id username fullname profile_image')
          .populate('to', '_id username fullname profile_image');

        io.to(`user:${to}`).emit('receive_message', populated);
        io.to(`user:${fromId}`).emit('receive_message', populated);
      } catch (err) {
        console.error("send_message error:", err);
      }
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
      const userId = socket.data.userId;
      if (userId) {
        removeUserSocket(userId, socket.id);
      }
    });
  });

  const port = process.env.PORT || 3000;
  httpServer.listen(port, () => {
    console.log(`Server and WebSocket running on port ${port}`);
  });
};

export default startServer;