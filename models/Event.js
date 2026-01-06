const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    date: String,
    time: String,
    type: {
        type: String,
        enum: ['Webinar', 'Meetup', 'Reunion'],
        default: 'Meetup'
    },
    location: String,
    image: String,
    description: String,
    organizer: String,
    interestedCount: {
        type: Number,
        default: 0
    },
    interestedUsers: [String] // Store User IDs
}, { timestamps: true });

module.exports = mongoose.model('Event', EventSchema);
