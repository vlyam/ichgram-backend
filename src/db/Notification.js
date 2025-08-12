import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const notificationSchema = new Schema({
    type: {
        type: String,
        enum: ['like', 'comment', 'follow'],
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    post: {
        type: Schema.Types.ObjectId,
        ref: 'Post'
    },
    to: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    read: {
        type: Boolean,
        default: false
    }
}, { timestamps: true, versionKey: false });

export default model('Notification', notificationSchema);
