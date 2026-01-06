const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const auth = require('../middleware/auth'); // We need to extract middleware first

// Middleware loaded at top


// Get all posts
router.get('/', async (req, res) => {
    try {
        // Only get posts that don't belong to a group (main feed)
        const posts = await Post.find({ groupId: null }).sort({ createdAt: -1 });
        // Transform _id to id if needed by frontend, or frontend handles it
        // Frontend expects 'timestamp' as number usually, but Date works too if cast
        // Let's return as is, frontend might need slight adjustment if it expects number vs ISO string
        // Actually frontend db.ts used Date.now() which is number. MongoDB is Date.
        // We can map it if we want perfect compatibility, or update frontend.
        // Let's send it and see.
        res.json(posts.map(p => ({
            ...p._doc,
            id: p._id,
            timestamp: new Date(p.createdAt).getTime()
        })));
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Create Post
router.post('/', auth, async (req, res) => {
    try {
        const newPost = new Post({
            userId: req.user.id,
            userName: req.body.userName,
            userAvatar: req.body.userAvatar,
            userRole: req.body.userRole,
            content: req.body.content,
            media: req.body.media || [],
            groupId: req.body.groupId || null
        });
        const post = await newPost.save();
        res.json({
            ...post._doc,
            id: post._id,
            timestamp: new Date(post.createdAt).getTime()
        });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Like Post
router.put('/like/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ msg: 'Post not found' });

        // Check if post has already been liked
        if (post.likedBy.includes(req.user.id)) {
            // Unlike
            post.likedBy = post.likedBy.filter(id => id !== req.user.id);
            post.likes--;
        } else {
            // Like
            post.likedBy.push(req.user.id);
            post.likes++;
        }

        await post.save();
        res.json(post);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Comment on Post
router.post('/comment/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ msg: 'Post not found' });

        const newComment = {
            userId: req.user.id,
            userName: req.body.userName,
            userAvatar: req.body.userAvatar,
            content: req.body.content,
            timestamp: new Date()
        };

        post.comments.push(newComment);
        await post.save();
        res.json(post.comments);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;
