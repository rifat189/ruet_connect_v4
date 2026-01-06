const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    company: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['Full-time', 'Internship', 'Contract'],
        required: true
    },
    postedBy: {
        type: String, // Name of the poster
        required: true
    },
    postedByUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    salary: String,
    description: String,
    requirements: [String]
}, { timestamps: true });

module.exports = mongoose.model('Job', JobSchema);
