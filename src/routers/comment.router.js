import express from "express";
import { createComment, getCommentsByPost } from "../controllers/comment.controller.js";
import { authenticate } from "../middlewares/authorization.js";

// Инициализация роутера для комментариев
const router = express.Router();

// Создать комментарий к посту
router.post("/", authenticate, createComment);

// Получить список комментариев по ID поста
router.get("/:postId", getCommentsByPost);

export default router;
