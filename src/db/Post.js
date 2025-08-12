import mongoose from 'mongoose';
import Comment from './Comment.js';
import Like from './Like.js';

const postSchema = new mongoose.Schema(
    {
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        image: {
            type: String, // base64 string
            required: true,
        },
        description: {
            type: String,
            maxlength: 2200,
        },
    },
    { timestamps: true, versionKey: false }
);

// pre-хук на удаление документа
postSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
    try {
        const postId = this._id;
        await Comment.deleteMany({ post: postId });
        await Like.deleteMany({ post: postId });
        next();
    } catch (err) {
        next(err);
    }
});

export default mongoose.model('Post', postSchema);