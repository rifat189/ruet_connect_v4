const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const auth = require('../middleware/auth');

// Get all events
router.get('/', async (req, res) => {
    try {
        const events = await Event.find().sort({ createdAt: -1 });
        res.json(events.map(e => ({ ...e._doc, id: e._id })));
    } catch (err) {
        res.status(500).send('Server Error');
    }
});



// Create Event
router.post('/', auth, async (req, res) => {
    try {
        const newEvent = new Event({
            title: req.body.title,
            date: req.body.date,
            time: req.body.time,
            type: req.body.type,
            location: req.body.location,
            image: req.body.image,
            description: req.body.description,
            organizer: req.body.organizer
        });
        const event = await newEvent.save();

        // Auto-post to feed
        // Need to require Post model if not already (it wasn't in the snippet, so I'll check/add it at top or here)
        // Ideally should be at top, but I'll add require(Post) if needed or assume I need to add it.
        // Let's add Post require at the top in a separate step to be safe, or just use it if I know it's there.
        // Wait, I saw the file content earlier, Post WAS NOT required.
        // I will add the route logic here assuming Post is available, and then I will add the require statement at the top.

        try {
            const Post = require('../models/Post');
            // Check if Post model exists to avoid error if file missing (unlikely)
            if (Post) {
                const newPost = new Post({
                    userId: req.user.id,
                    userName: req.user.name, // Accessing from req.user set by auth middleware
                    userAvatar: req.user.avatar,
                    userRole: req.user.role,
                    content: `📅 New Event Created: ${event.title} at ${event.location}. Join us!`,
                    media: event.image ? [{ type: 'image', url: event.image }] : [],
                    groupId: null
                });
                await newPost.save();
            }
        } catch (postErr) {
            console.error("Failed to auto-post event:", postErr);
            // Don't fail the event creation if posting fails
        }

        res.json({ ...event._doc, id: event._id });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Join Event
router.post('/:id/join', auth, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        // Check if already joined
        if (event.interestedUsers.includes(req.user.id)) {
            return res.status(400).json({ message: 'Already joined' });
        }

        event.interestedUsers.push(req.user.id);
        event.interestedCount = event.interestedUsers.length;
        await event.save();

        res.json({ ...event._doc, id: event._id });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
