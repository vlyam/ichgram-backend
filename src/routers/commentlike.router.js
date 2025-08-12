import express from "express";
import {
  toggleCommentLike,
  getCommentLikesCount,
  isCommentLikedByUser,
} from "../controllers/commentlike.controller.js";
import { authenticate } from "../middlewares/authorization.js";

// Инициализация роутера для лайков комментариев
const router = express.Router();

// Поставить или убрать лайк на комментарии
router.post("/", authenticate, toggleCommentLike);

// Получить количество лайков комментария
router.get("/count", getCommentLikesCount);

// Проверить, лайкнул ли текущий пользователь комментарий
router.get("/check", authenticate, isCommentLikedByUser);

export default router;
