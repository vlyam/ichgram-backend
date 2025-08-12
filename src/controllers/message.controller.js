import Message from '../db/Message.js';
import User from '../db/User.js';
import Conversation from '../db/Conversation.js';
import { getIo } from '../sockets/socketService.js';
import mongoose from 'mongoose';
const { ObjectId } = mongoose.Types;

// Создать или получить существующий диалог между двумя пользователями
export const createOrGetConversation = async (req, res) => {
    try {
        const myId = req.user.id;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ message: "userId is required" });
        }

        let conversation = await Conversation.findOne({
            participants: { $all: [myId, userId] }
        });

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [myId, userId]
            });
        }

        res.json({ conversationId: conversation._id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to create conversation" });
    }
};

// Создать новое сообщение и оповестить участников через сокеты
export const createMessage = async (req, res) => {
    try {
        const from = new ObjectId(req.user.id);
        const { to: toIdStr, text, conversationId: convIdStr } = req.body;

        if (!toIdStr || !text || !convIdStr) {
            return res.status(400).json({ message: 'to, text and conversationId are required' });
        }

        if (!mongoose.Types.ObjectId.isValid(convIdStr)) {
            return res.status(400).json({ message: 'Invalid conversationId format' });
        }

        const to = new ObjectId(toIdStr);
        const conversationId = new ObjectId(convIdStr);

        const message = await Message.create({
            conversationId,
            from,
            to,
            text,
        });

        const populated = await Message.findById(message._id)
            .populate('from', '_id username fullname profile_image')
            .populate('to', '_id username fullname profile_image');

        const io = getIo();
        if (io) {
            try {
                io.to(`user:${to.toString()}`).emit('receive_message', populated);
                io.to(`user:${from.toString()}`).emit('receive_message', populated);
            } catch (errEmit) {
                console.warn('Emit error (createMessage):', errEmit);
            }
        }

        return res.status(201).json(populated);
    } catch (err) {
        console.error('createMessage error:', err);
        return res.status(500).json({ message: 'Error creating message' });
    }
};

// Получить сообщения из диалога, пометить непрочитанные как прочитанные
export const getMessagesByConversation = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user.id;

        if (!mongoose.Types.ObjectId.isValid(conversationId)) {
            return res.status(400).json({ message: 'Invalid conversationId format' });
        }

        const userObjectId = new ObjectId(userId);
        const conversationObjectId = new ObjectId(conversationId);

        // Помечаем чужие непрочитанные сообщения как прочитанные
        try {
            const updateResult = await Message.updateMany(
                { conversationId: conversationObjectId, to: userObjectId, read: false },
                { $set: { read: true } }
            );
        } catch (e) {
            console.error("Error updating read status:", e);
        }

        // Загружаем сообщения с авторами
        const messages = await Message.find({ conversationId: conversationObjectId })
            .sort({ createdAt: 1 })
            .populate("from", "username fullname profile_image")
            .populate("to", "username fullname profile_image");

        res.json(messages);
    } catch (err) {
        console.error("Error loading messages:", err);
        res.status(500).json({ message: "Error loading messages" });
    }
};

// Получить список диалогов с последним сообщением и количеством непрочитанных
export const getConversations = async (req, res) => {
    try {
        const myId = req.user.id;
        const myObjectId = new ObjectId(myId);

        // Находим все чаты, где участвует пользователь
        let conversations = await Conversation.find({
            participants: myObjectId
        }).lean();

        const conversationIds = conversations.map(c => c._id);

        // Агрегируем последние сообщения и количество непрочитанных
        const messagesAgg = await Message.aggregate([
            { $match: { conversationId: { $in: conversationIds } } },
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: "$conversationId",
                    lastMessage: { $first: "$$ROOT" },
                    unreadCount: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ["$to", myObjectId] },
                                        { $eq: ["$read", false] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    }
                }
            }
        ]);

        const messagesMap = Object.fromEntries(
            messagesAgg.map(m => [m._id.toString(), m])
        );

        // Получаем ID собеседников
        const otherUserIds = conversations
            .map(c => c.participants?.find(p => p?.toString() !== myId))
            .filter(Boolean);

        const usersData = await User.find({ _id: { $in: otherUserIds } })
            .select("username fullname profile_image")
            .lean();

        // Формируем итоговый список диалогов
        const result = conversations
            .map(c => {
                const msgData = messagesMap[c._id.toString()];
                const otherUserId = c.participants?.find(p => p?.toString() !== myId);
                if (!otherUserId) return null;

                const otherUser = usersData.find(
                    u => u._id.toString() === otherUserId.toString()
                );
                if (!otherUser) return null;

                return {
                    conversationId: c._id,
                    text: msgData?.lastMessage?.text || "",
                    createdAt: msgData?.lastMessage?.createdAt || c.createdAt,
                    hasUnread: (msgData?.unreadCount || 0) > 0,
                    otherUser
                };
            })
            .filter(Boolean)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error loading conversations" });
    }
};

// Пометить все сообщения диалога как прочитанные и оповестить участников
export const putConversationIdRead = async (req, res) => {
    const conversationId = req.params.conversationId;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        return res.status(400).json({ message: 'Invalid conversationId format' });
    }

    try {
        const userObjectId = new ObjectId(userId);
        const conversationObjectId = new ObjectId(conversationId);

        const updateResult = await Message.updateMany(
            {
                conversationId: conversationObjectId,
                to: userObjectId,
                read: false,
            },
            { $set: { read: true } }
        );

        const updatedMessages = await Message.find({
            conversationId: conversationObjectId,
            to: userObjectId,
            read: true
        })
            .populate('from', '_id username fullname profile_image')
            .populate('to', '_id username fullname profile_image');

        // Отправляем через сокеты уведомление об обновлении
        const io = getIo();
        if (io) {
            const conversation = await Conversation.findById(conversationObjectId);
            if (conversation) {
                conversation.participants.forEach(participantId => {
                    io.to(`user:${participantId.toString()}`).emit('messages_read', {
                        conversationId,
                        updatedMessages
                    });
                });
            }
        }

        res.json({ updatedCount: updateResult.modifiedCount });
    } catch (err) {
        console.error('Error updating messages read status:', err);
        res.status(500).json({ message: 'Error updating messages read status' });
    }
};

// Удалить диалог и все сообщения, если пользователь — участник
export const deleteConversation = async (req, res) => {
    const { conversationId } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        return res.status(400).json({ message: "Invalid conversationId format" });
    }

    try {
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        if (!conversation.participants.some(p => p.toString() === userId)) {
            return res.status(403).json({ message: "Forbidden: you are not a participant of this conversation" });
        }

        await Message.deleteMany({ conversationId });
        await Conversation.findByIdAndDelete(conversationId);

        const io = getIo();
        if (io) {
            conversation.participants.forEach(participantId => {
                io.to(`user:${participantId.toString()}`).emit('conversation_deleted', { conversationId });
            });
        }

        return res.json({ message: "Conversation and messages deleted successfully" });
    } catch (err) {
        console.error("Error deleting conversation:", err);
        return res.status(500).json({ message: "Server error on deleting conversation" });
    }
};

// Пометить конкретное сообщение как прочитанное
export const putIdRead = async (req, res) => {
    const messageId = req.params.id;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
        return res.status(400).json({ message: 'Invalid message ID' });
    }

    try {
        const message = await Message.findOneAndUpdate(
            { _id: messageId, to: userId },
            { $set: { read: true } },
            { new: true }
        );
        if (!message) return res.status(404).json({ message: 'Message not found' });
        res.json(message);
    } catch (err) {
        res.status(500).json({ message: 'Error updating message' });
    }
};
