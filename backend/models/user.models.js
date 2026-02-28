import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
    firstname: {
        type: String,
        required: true,
    },
    lastname: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    matricNumber: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    }, 
    role: {
        type: String,
        enum: ['student', 'staff', 'admin'],
        default: 'student',
    },
    },
    { timestamps: true, versionKey: false}
);

const User = mongoose.model("User", userSchema);

export default User;