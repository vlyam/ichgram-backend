import mongoose from "mongoose";

const commentLikeSchema = new mongoose.Schema(
    {
        comment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment",
            required: true
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
    }, { timestamps: true, versionKey: false });

export default mongoose.model("CommentLike", commentLikeSchema);
