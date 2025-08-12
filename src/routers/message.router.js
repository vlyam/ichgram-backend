import express from "express";
import { authenticate } from "../middlewares/authorization.js";
import {
    createMessage,
    getMessagesByConversation,
    createOrGetConversation,
    getConversations,
    putConversationIdRead,
    putIdRead,
    deleteConversation,
} from "../controllers/message.controller.js";

const router = express.Router();

// Создать новый или получить существующий разговор
router.post("/conversations", authenticate, createOrGetConversation);

// Получить список разговоров пользователя
router.get("/conversations", authenticate, getConversations);

// Получить сообщения по ID разговора
router.get("/conversations/:conversationId", authenticate, getMessagesByConversation);

// Отправить новое сообщение
router.post("/", authenticate, createMessage);

// Отметить все сообщения в разговоре как прочитанные
router.put("/conversations/:conversationId/read", authenticate, putConversationIdRead);

// Отметить одно сообщение как прочитанное
router.put("/:id/read", authenticate, putIdRead);

// Удалить разговор
router.delete("/conversations/:conversationId", authenticate, deleteConversation);

export default router;
