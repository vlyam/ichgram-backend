import bcrypt from "bcrypt";
import User from "../db/User.js";
import Follow from "../db/Follow.js";
import Post from "../db/Post.js";
import Like from "../db/Like.js";
import Comment from "../db/Comment.js";
import CommentLike from "../db/CommentLike.js";
import Notification from "../db/Notification.js";
import Conversation from "../db/Conversation.js";
import Message from "../db/Message.js";
import { getUserIdFromToken } from "../utils/getUserIdFromToken.js";
import { passwordSchema } from "../validation/users.schema.js";

// Получение профиля текущего авторизованного пользователя

export const getUserProfileController = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    const user = await User.findById(userId).select("-passwordHash -verificationCode -token");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const followersCount = await Follow.countDocuments({ following: userId });
    const followingCount = await Follow.countDocuments({ follower: userId });

    res.json({
      ...user.toObject(),
      followers: followersCount,
      following: followingCount,
    });
  } catch (error) {
    res.status(500).json({ message: "Error getting profile", error: error.message });
  }
};

// Получение публичного профиля по ID пользователя

export const getPublicUserProfileController = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select("fullname username profile_image");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Получение профиля пользователя по ID

export const getUserByIdController = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).select("-passwordHash -verificationCode -token");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const followersCount = await Follow.countDocuments({ following: userId });
    const followingCount = await Follow.countDocuments({ follower: userId });

    res.json({
      ...user.toObject(),
      followers: followersCount,
      following: followingCount,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Обновление профиля текущего пользователя

export const updateUserProfileController = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { username, fullname, website, bio } = req.body;

    if (username) user.username = username;
    if (fullname) user.fullname = fullname;
    if (website) user.website = website;
    if (bio) user.bio = bio;

    // Загрузка изображения профиля из файла
    if (req.file) {
      const base64Image = req.file.buffer.toString("base64");
      const base64EncodedImage = `data:${req.file.mimetype};base64,${base64Image}`;
      user.profile_image = base64EncodedImage;
    }

    // Установка изображения профиля напрямую из body
    if (req.body.profile_image) {
      user.profile_image = req.body.profile_image;
    }

    const updatedUser = await user.save();
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: "Profile update error", error: error.message });
  }
};

// Смена пароля текущего пользователя

export const changePasswordController = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Проверка текущего пароля
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return res.status(400).json({
        message: "Validation failed",
        fieldErrors: [
          { field: "currentPassword", message: "Current password is incorrect" }
        ]
      });
    }

    // Проверка нового пароля по схеме
    try {
      await passwordSchema.validate(newPassword);
    } catch (validationError) {
      return res.status(400).json({
        message: "Validation failed",
        fieldErrors: [
          { field: "newPassword", message: validationError.message }
        ]
      });
    }

    // Обновление пароля
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error changing password", error: error.message });
  }
};

// Поиск пользователей по имени или username

export const searchUsersController = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === "") {
      return res.status(400).json({ message: "Search query is required" });
    }

    const regex = new RegExp(q.trim(), "i");

    const users = await User.find({
      $or: [
        { username: { $regex: regex } },
        { fullname: { $regex: regex } },
      ],
    }).select("username fullname profile_image");

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Получение списка пользователей по массиву ID (bulk-запрос)

export const bulkController = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "IDs array is required" });
    }

    const users = await User.find({ _id: { $in: ids } }).select("username fullname profile_image");

    // Сохраняем порядок такой же, как в переданном массиве
    const usersMap = new Map(users.map(u => [u._id.toString(), u]));
    const orderedUsers = ids.map(id => usersMap.get(id)).filter(Boolean);

    res.json(orderedUsers);
  } catch (error) {
    res.status(500).json({ message: "Error in bulk users request", error: error.message });
  }
};


// Удаление профиля текущего пользователя и всех связанных данных
export const deleteUserProfileController = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);

    console.log("Deleting user:", userId);

    // 1. Удаляем все подписки
    await Follow.deleteMany({ $or: [{ follower: userId }, { following: userId }] });

    // 2. Находим все посты пользователя
    const posts = await Post.find({ author: userId });
    const postIds = posts.map(p => p._id);

    // 3. Удаляем все лайки и комментарии на этих постах
    await Like.deleteMany({ post: { $in: postIds } });
    await CommentLike.deleteMany({ comment: { $in: await Comment.find({ post: { $in: postIds } }).distinct("_id") } });
    await Comment.deleteMany({ post: { $in: postIds } });

    // 4. Удаляем сами посты
    await Post.deleteMany({ author: userId });

    // 5. Удаляем все лайки и комментарии, которые пользователь оставил на чужих постах
    await Like.deleteMany({ user: userId });
    await Comment.deleteMany({ author: userId });
    await CommentLike.deleteMany({ user: userId });

    // 6. Удаляем уведомления пользователя (кто создал и кому приходили)
    await Notification.deleteMany({ $or: [{ user: userId }, { to: userId }] });

    // 7. Удаляем сообщения и разговоры пользователя
    const conversations = await Conversation.find({ participants: userId });
    const conversationIds = conversations.map(c => c._id);

    await Message.deleteMany({ $or: [{ from: userId }, { to: userId }, { conversationId: { $in: conversationIds } }] });
    await Conversation.deleteMany({ _id: { $in: conversationIds } });

    // 8. Удаляем самого пользователя
    await User.findByIdAndDelete(userId);

    res.json({ message: "User and all related data deleted successfully" });
  } catch (err) {
    console.error("Error deleting user profile:", err);
    res.status(500).json({ message: "Failed to delete user profile", error: err.message });
  }
};
