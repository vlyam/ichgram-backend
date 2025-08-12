import Notification from '../db/Notification.js';
import mongoose from 'mongoose';

export const getNotifications = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.id);

        const notifications = await Notification.find({ to: userId })
            .sort({ createdAt: -1 })
            .populate('user', '_id username profile_image')
            .populate('post', '_id image')
            .lean();

        const unreadCount = notifications.filter(n => !n.read).length;

        res.json({
            notifications,
            unreadCount
        });

    } catch (err) {
        console.error('getNotifications error:', err);
        res.status(500).json({ message: 'Error loading notifications' });
    }
};

// export const markAllNotificationsRead = async (req, res) => {
//     try {
//         const userId = new mongoose.Types.ObjectId(req.user.id);

//         // const result = await Notification.updateMany(
//         //     { to: userId, read: false },
//         //     { $set: { read: true } }
//         // );

//         const result = await Notification.deleteMany({ to: userId, read: false });
//         res.json({ deletedCount: result.deletedCount });
//         res.json({ updatedCount: result.modifiedCount });
//     } catch (err) {
//         console.error('markAllNotificationsRead error:', err);
//         res.status(500).json({ message: 'Error deleting notifications' });
//     }
// };

export const markAllNotificationsRead = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.id);

        const result = await Notification.updateMany(
            { to: userId, read: false },
            { $set: { read: true } }
        );
        await cleanOldNotifications(userId, 30);
        res.json({ updatedCount: result.modifiedCount });
    } catch (err) {
        console.error('markAllNotificationsRead error:', err);
        res.status(500).json({ message: 'Error marking notifications read' });
    }
};

export const cleanOldNotifications = async (userId, maxCount = 30) => {
    try {
        const count = await Notification.countDocuments({ to: userId });
        if (count > maxCount) {
            const excessCount = count - maxCount;

            const oldestNotifications = await Notification.find({ to: userId })
                .sort({ createdAt: 1 })
                .limit(excessCount)
                .select('_id');

            const idsToDelete = oldestNotifications.map(n => n._id);

            await Notification.deleteMany({ _id: { $in: idsToDelete } });
        }
    } catch (error) {
        console.error('cleanOldNotifications error:', error);
    }
};

export const clearNotifications = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.id);

        const result = await Notification.deleteMany({ to: userId });

        res.json({ deletedCount: result.deletedCount });
    } catch (err) {
        console.error('clearNotifications error:', err);
        res.status(500).json({ message: 'Error clearing notifications' });
    }
};
