const express = require('express');
const router = express.Router();
const User = require('../models/User');
const ConnectionRequest = require('../models/ConnectionRequest');

const auth = require('../middleware/auth');

// Get all users
router.get('/', auth, async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users.map(u => ({
            ...u._doc,
            id: u._id
        })));
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Send Connect Request
router.post('/connect/:id', auth, async (req, res) => {
    try {
        const senderId = req.user.id;
        const receiverId = req.params.id;

        if (senderId === receiverId) {
            return res.status(400).json({ message: 'Cannot connect to yourself' });
        }

        // Check if Request already exists
        const existing = await ConnectionRequest.findOne({
            $or: [
                { senderId, receiverId },
                { senderId: receiverId, receiverId: senderId }
            ]
        });

        if (existing) {
            return res.status(400).json({ message: 'Connection request already exists or you are already connected' });
        }

        const newRequest = new ConnectionRequest({
            senderId,
            receiverId,
            status: 'pending'
        });

        await newRequest.save();

        // Create Notification for receiver
        const Notification = require('../models/Notification');
        const sender = await User.findById(senderId);

        await new Notification({
            userId: receiverId,
            type: 'connection_request',
            content: `${sender.name} sent you a connection request`,
            relatedId: senderId,
            link: `/profile/${senderId}`
        }).save();

        res.json(newRequest);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Accept Connect Request
router.post('/accept/:id', auth, async (req, res) => {
    try {
        const requestId = req.params.id;
        const receiverId = req.user.id;

        const request = await ConnectionRequest.findById(requestId);

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        if (request.receiverId.toString() !== receiverId) {
            return res.status(401).json({ message: 'User not authorized to accept this request' });
        }

        request.status = 'accepted';
        await request.save();

        // Add to connections for both users
        await User.findByIdAndUpdate(request.senderId, {
            $addToSet: { connections: request.receiverId }
        });
        await User.findByIdAndUpdate(request.receiverId, {
            $addToSet: { connections: request.senderId }
        });

        res.json({ message: 'Connection accepted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Reject Connect Request
router.post('/reject/:id', auth, async (req, res) => {
    try {
        const requestId = req.params.id;
        const receiverId = req.user.id;

        const request = await ConnectionRequest.findById(requestId);

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        if (request.receiverId.toString() !== receiverId) {
            return res.status(401).json({ message: 'User not authorized to reject this request' });
        }

        request.status = 'rejected';
        await request.save();

        res.json({ message: 'Connection rejected' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get Pending Requests for current user
router.get('/requests/pending', auth, async (req, res) => {
    try {
        const requests = await ConnectionRequest.find({
            receiverId: req.user.id,
            status: 'pending'
        }).populate('senderId', 'name avatar department batch role');

        res.json(requests.map(r => ({
            ...r._doc,
            id: r._id,
            sender: {
                ...r.senderId._doc,
                id: r.senderId._id
            }
        })));
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get Outgoing Pending Requests for current user
router.get('/requests/outgoing', auth, async (req, res) => {
    try {
        const requests = await ConnectionRequest.find({
            senderId: req.user.id,
            status: 'pending'
        });

        res.json(requests.map(r => ({
            ...r._doc,
            id: r._id,
            receiverId: r.receiverId.toString()
        })));
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});




// Get established connections for current user
router.get('/connections', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('connections', '-password');
        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json(user.connections.map(u => ({
            ...u._doc,
            id: u._id
        })));
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// Update User Profile
router.put('/:id', auth, async (req, res) => {
    try {
        if (req.user.id !== req.params.id) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        const {
            name, role, department, batch, avatar, coverPhoto,
            company, position, bio, socialLinks, skills,
            projects, experience
        } = req.body;

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (name) user.name = name;
        if (role) user.role = role;
        if (department) user.department = department;
        if (batch) user.batch = batch;
        if (avatar) user.avatar = avatar;
        if (coverPhoto) user.coverPhoto = coverPhoto;
        if (company) user.company = company;
        if (position) user.position = position;
        if (bio) user.bio = bio;
        if (socialLinks) user.socialLinks = socialLinks;
        if (skills) user.skills = skills;
        if (projects) user.projects = projects;
        if (experience) user.experience = experience;

        // Mentorship fields
        if (req.body.isMentor !== undefined) user.isMentor = req.body.isMentor;
        if (req.body.mentoringSkills) user.mentoringSkills = req.body.mentoringSkills;
        if (req.body.mentorshipBio !== undefined) user.mentorshipBio = req.body.mentorshipBio;
        if (req.body.lookingForMentorship !== undefined) user.lookingForMentorship = req.body.lookingForMentorship;

        await user.save();

        res.json({
            ...user._doc,
            id: user._id
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// Delete User
router.delete('/:id', auth, async (req, res) => {
    try {
        // Ensure user deletes themselves
        if (req.user.id !== req.params.id) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
