import express from "express";
import {
  getAllPosts,
  getUserPosts,
  getFeedPosts,
  getExplorePosts,
  createPost,
  getPostById,
  getPostsByUserId,
  deletePost,
  updatePost,
} from "../controllers/post.controller.js";
import { authenticate } from "../middlewares/authorization.js";

const router = express.Router();

// Получить все посты
router.get("/", getAllPosts);

// Получить посты текущего пользователя
router.get("/me", authenticate, getUserPosts);

// Получить посты для ленты пользователя на главной
router.get("/feed", authenticate, getFeedPosts);

// Получить посты для раздела "Explore"
router.get("/explore", authenticate, getExplorePosts);

// Создать новый пост
router.post("/", authenticate, createPost);

// Получить пост по ID
router.get("/:id", getPostById);

// Получить посты пользователя по ID
router.get("/user/:id", getPostsByUserId);

// Удалить пост
router.delete("/:id", authenticate, deletePost);

// Обновить пост
router.put("/:id", authenticate, updatePost);

export default router;
