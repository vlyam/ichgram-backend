import Follow from "../db/Follow.js";
import Notification from "../db/Notification.js";

// Подписаться на пользователя
export const followUser = async (req, res) => {
  try {
    const followerId = req.user.id;
    const followingId = req.params.id;

    if (followerId === followingId) {
      return res.status(400).json({ message: "Cannot follow yourself" });
    }

    const alreadyFollowing = await Follow.findOne({ follower: followerId, following: followingId });
    if (alreadyFollowing) {
      return res.status(400).json({ message: "Already following" });
    }

    await Follow.create({ follower: followerId, following: followingId });
    
    // Создаем уведомление о подписке
    await Notification.create({
      type: "follow",
      user: followerId, // кто подписался
      to: followingId, // на кого подписались
    });

    res.status(201).json({ followed: true });
  } catch (err) {
    console.error("Error following user:", err);
    res.status(500).json({ message: "Failed to follow user" });
  }
};

// Отписаться от пользователя
export const unfollowUser = async (req, res) => {
  try {
    const followerId = req.user.id;
    const followingId = req.params.id;

    await Follow.findOneAndDelete({ follower: followerId, following: followingId });
    res.json({ followed: false });
  } catch (err) {
    console.error("Error unfollowing user:", err);
    res.status(500).json({ message: "Failed to unfollow user" });
  }
};

// Получить список подписчиков пользователя
export const getFollowers = async (req, res) => {
  try {
    const userId = req.params.id;
    const follows = await Follow.find({ following: userId }).populate("follower", "username profile_image");
    const followers = follows.map(f => f.follower).filter(Boolean);
    res.json(followers);
  } catch (err) {
    console.error("Error getting followers:", err);
    res.status(500).json({ message: "Failed to get followers" });
  }
};

// Получить список, на кого подписан пользователь
export const getFollowing = async (req, res) => {
  try {
    const userId = req.params.id;
    const follows = await Follow.find({ follower: userId }).populate("following", "username profile_image");
    const following = follows.map(f => f.following).filter(Boolean);
    res.json(following);
  } catch (err) {
    console.error("Error getting following:", err);
    res.status(500).json({ message: "Failed to get following" });
  }
};

// Проверить статус подписки
export const checkFollowStatus = async (req, res) => {
  try {
    const followerId = req.user.id;
    const followingId = req.params.id;
    const exists = await Follow.findOne({ follower: followerId, following: followingId });
    res.json({ followed: !!exists });
  } catch (err) {
    console.error("Error checking follow status:", err);
    res.status(500).json({ message: "Failed to check follow status" });
  }
};
