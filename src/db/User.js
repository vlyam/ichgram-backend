import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true
        },
        fullname: {
            type: String,
            required: true
        },
        username: {
            type: String,
            required: true
        },
        passwordHash: {
            type: String,
            required: true
        },
        verify: {
            type: Boolean,
            default: false
        },
        verificationCode: {
            type: String,
            default: ""
        },
        token: {
            type: String,
            default: ""
        },
        website:
        {
            type: String,
            default: ""
        },
        bio: {
            type: String,
            default: ""
        },
        profile_image: {
            type: String,
            default: ""
        }
    },
    { timestamps: true, versionKey: false }
);

userSchema.methods.comparePassword = function (password) {
    return bcrypt.compare(password, this.passwordHash);
};

const User = mongoose.model("User", userSchema);
export default User;