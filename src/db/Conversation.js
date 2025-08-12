import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const conversationSchema = new Schema({
    participants: [
        { type: Schema.Types.ObjectId, ref: "User" }
    ]
}, { timestamps: true, versionKey: false });

export default model('Conversation', conversationSchema);