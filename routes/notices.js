const express = require('express');
const router = express.Router();
const Notice = require('../models/Notice');
const auth = require('../middleware/auth');
const User = require('../models/User');

// Get all notices
router.get('/', async (req, res) => {
    try {
        const notices = await Notice.find().sort({ createdAt: -1 });
        res.json(notices);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Create a notice
router.post('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const newNotice = new Notice({
            title: req.body.title,
            content: req.body.content,
            category: req.body.category,
            postedBy: user.name,
            postedByUserId: req.user.id
        });

        const notice = await newNotice.save();
        res.json(notice);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
