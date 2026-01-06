const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
    userId: String,
    userName: String,
    userAvatar: String,
    content: String,
    timestamp: { type: Date, default: Date.now }
});

const PostSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userName: String,
    userAvatar: String,
    userRole: String,
    content: {
        type: String,
        required: true
    },
    media: [{
        type: { type: String, enum: ['image', 'video'] },
        url: String
    }],
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        default: null
    },
    likes: {
        type: Number,
        default: 0
    },
    likedBy: [String], // Storing User IDs
    comments: [CommentSchema]
}, { timestamps: true });

module.exports = mongoose.model('Post', PostSchema);
