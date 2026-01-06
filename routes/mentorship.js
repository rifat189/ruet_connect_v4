const express = require('express');
const router = express.Router();
const User = require('../models/User');
const MentorshipRequest = require('../models/MentorshipRequest');
const auth = require('../middleware/auth');
const Notification = require('../models/Notification');
// Get all mentors
router.get('/mentors', auth, async (req, res) => {
    try {
        const mentors = await User.find({ isMentor: true }).select('-password');
        res.json(mentors);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Join mentorship program
router.post('/become', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.isMentor = true;
        await user.save();

        res.json({ message: 'You are now a mentor', user });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Send mentorship request
router.post('/request', auth, async (req, res) => {
    try {
        const { mentorId, topic, message } = req.body;
        const menteeId = req.user.id;

        if (mentorId === menteeId) {
            return res.status(400).json({ message: 'Cannot request mentorship from yourself' });
        }

        // Check if mentor exists
        const mentor = await User.findById(mentorId);
        if (!mentor || !mentor.isMentor) {
            return res.status(404).json({ message: 'Mentor not found' });
        }

        // Check for existing request
        const existing = await MentorshipRequest.findOne({ mentorId, menteeId, status: 'pending' });
        if (existing) {
            return res.status(400).json({ message: 'Mentorship request already pending' });
        }

        const newRequest = new MentorshipRequest({
            mentorId,
            menteeId,
            topic,
            message
        });

        await newRequest.save();

        // Create notification for mentor
        const mentee = await User.findById(menteeId);
        await new Notification({
            userId: mentorId,
            type: 'connection_request', // Reusing connection type or system for now
            title: 'New Mentorship Request',
            content: `${mentee.name} requested mentorship in ${topic}`,
            relatedId: menteeId,
            link: '/mentorship'
        }).save();

        res.json(newRequest);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get all requests for logged-in user
router.get('/requests', auth, async (req, res) => {
    try {
        const incoming = await MentorshipRequest.find({ mentorId: req.user.id })
            .populate('menteeId', 'name avatar department batch role')
            .sort({ createdAt: -1 });

        const outgoing = await MentorshipRequest.find({ menteeId: req.user.id })
            .populate('mentorId', 'name avatar department batch role')
            .sort({ createdAt: -1 });

        res.json({ incoming, outgoing });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Accept mentorship request
router.post('/requests/:id/accept', auth, async (req, res) => {
    try {
        const request = await MentorshipRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ message: 'Request not found' });

        if (request.mentorId.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        request.status = 'accepted';
        await request.save();

        // Notify mentee
        const mentor = await User.findById(req.user.id);
        await new Notification({
            userId: request.menteeId,
            type: 'system',
            title: 'Mentorship Accepted',
            content: `${mentor.name} has accepted your mentorship request!`,
            relatedId: req.user.id,
            link: '/mentorship'
        }).save();

        res.json(request);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Reject mentorship request
router.post('/requests/:id/reject', auth, async (req, res) => {
    try {
        const request = await MentorshipRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ message: 'Request not found' });

        if (request.mentorId.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        request.status = 'rejected';
        await request.save();

        res.json({ message: 'Request rejected' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
