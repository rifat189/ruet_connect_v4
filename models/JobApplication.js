const mongoose = require('mongoose');

const JobApplicationSchema = new mongoose.Schema({
    jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['Applied', 'Interviewing', 'Accepted', 'Rejected'],
        default: 'Applied'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Create index for unique applications
JobApplicationSchema.index({ jobId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('JobApplication', JobApplicationSchema);
