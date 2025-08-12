// Сокет-сервер для реалтайм-сообщений

import http from "http";
import { Server as IOServer } from "socket.io";
import Message from "./db/Message.js";
import mongoose from "mongoose";
const { ObjectId } = mongoose.Types;

import { setIo, addUserSocket, removeUserSocket } from "./sockets/socketService.js";

const startWebsocketServer = () => {
    const httpServer = http.createServer();

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

    const port = process.env.WSPORT || 5001;
    httpServer.listen(port, () => {
        console.log(`Websocket server running on port ${port}`);
    });
};

export default startWebsocketServer;
