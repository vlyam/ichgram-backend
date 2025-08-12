import express from "express";
import { toggleLike, getLikesCount, isLikedByUser } from "../controllers/like.controller.js";
import { authenticate } from "../middlewares/authorization.js";

const router = express.Router();

// Переключить лайк/дизлайк поста
router.post("/", authenticate, toggleLike);

// Получить количество лайков поста
router.get("/count", getLikesCount);

// Проверить, лайкнул ли текущий пользователь пост
router.get("/check", authenticate, isLikedByUser);

export default router;
