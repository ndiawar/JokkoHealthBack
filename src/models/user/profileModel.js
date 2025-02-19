import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    dateOfBirth: {
        type: Date,
        required: true,
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        required: true,
    },
    bio: {
        type: String,
        maxlength: 500,
    },
    profilePicture: {
        type: String,
        default: 'default-profile.png',
    },
    preferences: {
        type: Object,
        default: {},
    },
}, { timestamps: true });

export default mongoose.model('Profile', profileSchema);
