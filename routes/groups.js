const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const Post = require('../models/Post');
const auth = require('../middleware/auth');
const User = require('../models/User');

// Get all groups
router.get('/', auth, async (req, res) => {
    try {
        const groups = await Group.find().sort({ createdAt: -1 }).populate('members', 'id');
        res.json(groups);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Create a group
router.post('/', auth, async (req, res) => {
    try {
        const newGroup = new Group({
            name: req.body.name,
            description: req.body.description,
            privacy: req.body.privacy,
            createdBy: req.user.id,
            members: [req.user.id] // Creator is first member
        });

        const group = await newGroup.save();
        res.json(group);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Join/Leave group
router.post('/:id/join', auth, async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ message: 'Group not found' });

        const index = group.members.indexOf(req.user.id);
        if (index === -1) {
            group.members.push(req.user.id);
        } else {
            group.members.splice(index, 1);
        }
        await group.save();
        res.json(group);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get group posts
router.get('/:id/posts', auth, async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ message: 'Group not found' });

        // Check privacy (simplified: public or member can see)
        const isMember = group.members.includes(req.user.id);
        if (group.privacy === 'Private' && !isMember) {
            return res.status(403).json({ message: 'Private group. Join to see posts.' });
        }

        const posts = await Post.find({ groupId: req.params.id }).sort({ createdAt: -1 });
        res.json(posts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
