import Like from "../db/Like.js";
import Post from "../db/Post.js";
import Comment from "../db/Comment.js";
import Notification from "../db/Notification.js";

// Переключить лайк для поста или комментария
export const toggleLike = async (req, res) => {
    try {
        const userId = req.user.id;
        const { postId, commentId } = req.body;

        if (!postId && !commentId) {
            return res.status(400).json({ message: "postId or commentId must be provided" });
        }

        // Проверка существования поста или комментария
        if (postId) {
            const post = await Post.findById(postId);
            if (!post) return res.status(404).json({ message: "Post not found" });
        }

        if (commentId) {
            const comment = await Comment.findById(commentId);
            if (!comment) return res.status(404).json({ message: "Comment not found" });
        }

        // Проверка существующего лайка
        const existingLike = await Like.findOne({
            user: userId,
            ...(postId && { post: postId }),
            ...(commentId && { comment: commentId }),
        });

        if (existingLike) {
            await Like.findByIdAndDelete(existingLike._id);
            return res.json({ liked: false });
        }

        // Создание лайка
        const newLike = await Like.create({
            user: userId,
            post: postId,
            comment: commentId,
        });

        // Определение владельца поста или комментария
        let ownerId = null;
        if (postId) {
            const post = await Post.findById(postId);
            if (post && String(post.author) !== String(userId)) {
                ownerId = post.author;
            }
        }
        if (commentId) {
            const comment = await Comment.findById(commentId);
            if (comment && String(comment.author) !== String(userId)) {
                ownerId = comment.author;
            }
        }

        // Создание уведомления о лайке, если владелец существует
        if (ownerId) {
            await Notification.create({
                type: "like",
                user: userId,
                post: postId || null,
                to: ownerId,
            });
        }

        res.status(201).json({ liked: true, likeId: newLike._id });
    } catch (error) {
        console.error("Error toggling like:", error);
        res.status(500).json({ message: "Failed to toggle like" });
    }
};

// Получить количество лайков для поста или комментария
export const getLikesCount = async (req, res) => {
    try {
        const { postId, commentId } = req.query;

        if (!postId && !commentId) {
            return res.status(400).json({ message: "postId or commentId must be provided" });
        }

        const count = await Like.countDocuments({
            ...(postId && { post: postId }),
            ...(commentId && { comment: commentId }),
        });

        res.json({ count });
    } catch (error) {
        console.error("Error getting likes count:", error);
        res.status(500).json({ message: "Failed to get likes count" });
    }
};

// Проверить, лайкнул ли пользователь пост или комментарий
export const isLikedByUser = async (req, res) => {
    try {
        const userId = req.user.id;
        const { postId, commentId } = req.query;

        const like = await Like.findOne({
            user: userId,
            ...(postId && { post: postId }),
            ...(commentId && { comment: commentId }),
        });

        res.json({ liked: !!like });
    } catch (error) {
        console.error("Error checking like status:", error);
        res.status(500).json({ message: "Failed to check like status" });
    }
};
