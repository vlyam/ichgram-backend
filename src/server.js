// Основной HTTP сервер с настройкой маршрутов и мидлваров

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

const startServer = () => {
    const app = express();

    // Подключаем CORS и парсеры JSON и URL-encoded с лимитом 10 Мб
    app.use(cors());
    app.use(express.json({ limit: "10mb" }));
    app.use(express.urlencoded({ limit: "10mb", extended: true }));

    // Роуты приложения через префикс /api
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

    // Обработка 404 и ошибок
    app.use(notFoundHandler);
    app.use(errorHandler);

    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`Server running on port ${port}`));
};

export default startServer;
