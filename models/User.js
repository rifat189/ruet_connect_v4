const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['Admin', 'Alumni', 'Student', 'Faculty', 'Company', 'Teacher'],
        default: 'Student'
    },
    department: String,
    batch: String,
    avatar: String,
    coverPhoto: String,
    company: String,
    position: String,
    bio: String,
    socialLinks: {
        linkedin: String,
        github: String,
        twitter: String,
        website: String
    },
    skills: [String],
    accomplishments: [String],
    // projects and experience could be subdocuments or separate schemas, keeping simple for now
    projects: [{
        id: String,
        title: String,
        description: String,
        link: String,
        tags: [String]
    }],
    experience: [{
        id: String,
        company: String,
        role: String,
        period: String,
        description: String
    }],
    isVerified: {
        type: Boolean,
        default: false
    },
    connections: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    isMentor: {
        type: Boolean,
        default: false
    },
    mentoringSkills: [String],
    mentorshipBio: String,
    lookingForMentorship: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
