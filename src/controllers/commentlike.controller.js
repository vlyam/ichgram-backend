import Like from "../db/Like.js";
import Comment from "../db/Comment.js";

// Переключить лайк на комментарии
export const toggleCommentLike = async (req, res) => {
  try {
    const userId = req.user._id;
    const { commentId } = req.body;

    if (!commentId) {
      return res.status(400).json({ message: "CommentId is required" });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const existing = await Like.findOne({ comment: commentId, user: userId });

    if (existing) {
      await existing.deleteOne();
      return res.json({ liked: false });
    }

    const newLike = await Like.create({ comment: commentId, user: userId });
    res.status(201).json({ liked: true, likeId: newLike._id });
  } catch (error) {
    console.error("Error toggling comment like:", error);
    res.status(500).json({ message: "Failed to toggle comment like" });
  }
};

// Получить количество лайков комментария
export const getCommentLikesCount = async (req, res) => {
  try {
    const { commentId } = req.query;

    if (!commentId) {
      return res.status(400).json({ message: "CommentId is required" });
    }

    const count = await Like.countDocuments({ comment: commentId });
    res.json({ count });
  } catch (error) {
    console.error("Error getting comment likes count:", error);
    res.status(500).json({ message: "Failed to get comment likes count" });
  }
};

// Проверить, лайкнул ли пользователь комментарий
export const isCommentLikedByUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const { commentId } = req.query;

    if (!commentId) {
      return res.status(400).json({ message: "CommentId is required" });
    }

    const like = await Like.findOne({ comment: commentId, user: userId });
    res.json({ liked: !!like });
  } catch (error) {
    console.error("Error checking comment like status:", error);
    res.status(500).json({ message: "Failed to check comment like status" });
  }
};
