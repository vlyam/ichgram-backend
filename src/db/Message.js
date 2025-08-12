import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const messageSchema = new Schema({
    conversationId: {
        type: Schema.Types.ObjectId,
        required: true,
        index: true
    },
    from: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    to: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    text: {
        type: String,
        required: true
    },
    read: {
        type: Boolean,
        default: false
    }
}, { timestamps: true, versionKey: false });

export default model('Message', messageSchema);