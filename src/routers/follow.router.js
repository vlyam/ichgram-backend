import express from "express";
import {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  checkFollowStatus,
} from "../controllers/follow.controller.js";
import { authenticate } from "../middlewares/authorization.js";

const router = express.Router();

// Подписаться на пользователя
router.post("/follow/:id", authenticate, followUser);

// Отписаться от пользователя
router.delete("/unfollow/:id", authenticate, unfollowUser);

// Получить список подписчиков пользователя
router.get("/followers/:id", getFollowers);

// Получить список подписок пользователя
router.get("/following/:id", getFollowing);

// Проверить, подписан ли текущий пользователь на другого пользователя
router.get("/check/:id", authenticate, checkFollowStatus);

export default router;
