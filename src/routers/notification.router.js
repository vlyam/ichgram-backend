import express from "express";
import { authenticate } from "../middlewares/authorization.js";
import {
    getNotifications,
    markAllNotificationsRead,
    clearNotifications
} from "../controllers/notification.controller.js";

const router = express.Router();

// Получить список уведомлений пользователя
router.get("/", authenticate, getNotifications);

// Пометить все уведомления как прочитанные
router.put("/read-all", authenticate, markAllNotificationsRead);

// Очистить все уведомления пользователя
router.delete("/", authenticate, clearNotifications);

export default router;