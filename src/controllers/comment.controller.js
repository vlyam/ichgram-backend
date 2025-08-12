import Comment from "../db/Comment.js";
import Post from "../db/Post.js";
import Notification from "../db/Notification.js";

// Создание нового комментария к посту
export const createComment = async (req, res) => {
    try {
        const { postId, text } = req.body;
        const userId = req.user._id;

        if (!text || !postId) {
            return res.status(400).json({ message: "Text or post ID not specified" });
        }

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        const newComment = await Comment.create({
            text,
            post: postId,
            author: userId,
        });

        const populatedComment = await newComment.populate("author", "username fullname profile_image");

        // Создаем уведомление, если комментирует не автор поста
        if (String(post.author) !== String(userId)) {
            await Notification.create({
                type: "comment",
                user: userId,
                post: postId,
                to: post.author,
            });
        }

        res.status(201).json(populatedComment);
    } catch (error) {
        // Ошибка при создании комментария
        res.status(500).json({ message: "Failed to create comment" });
    }
};

// Получение всех комментариев к указанному посту
export const getCommentsByPost = async (req, res) => {
    try {
        const { postId } = req.params;

        const comments = await Comment.find({ post: postId })
            .populate("author", "username fullname profile_image")
            .sort({ createdAt: 1 });

        res.json(comments);
    } catch (error) {
        // Ошибка при получении комментариев
        res.status(500).json({ message: "Failed to get comments" });
    }
};
