const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

// Middleware loaded at top


// Create a notification (Manual/System)
router.post('/', auth, async (req, res) => {
    try {
        const { userId, type, content, relatedId } = req.body;

        // If userId is not provided, maybe it's for the current user? 
        // Or if it IS provided, it's for someone else.
        // The frontend db.addNotification calls it with { userId: authUser.id } which implies "Notification FOR me" (local echo)
        // OR "Notification FROM me"?
        // Looking at Network.tsx: userId: authUser.id.
        // Wait, if I add a notification for MYSELF, that's just a local toast.
        // But Mentorship.tsx says: "Your request ... has been sent".
        // Use case: Creating a notification for the OTHER user?
        // Mentorship.tsx: `userId: user.id`... wait.

        // Network.tsx: `userId: authUser.id` -> "You sent a connection request..."
        // It seems these usages are for "Activity Log" or "My Notifications".
        // Let's assume the POST is to create a notification object.

        const notification = new Notification({
            userId, // The generic recipient
            type,
            content,
            relatedId
        });

        await notification.save();
        res.json(notification);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get all notifications for current user
router.get('/', auth, async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(notifications.map(n => ({
            id: n._id,
            ...n._doc
        })));
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Mark notification as read
router.put('/:id/read', auth, async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (!notification) return res.status(404).json({ msg: 'Notification not found' });

        if (notification.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        notification.isRead = true;
        await notification.save();
        res.json(notification);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Clear all notifications
router.delete('/', auth, async (req, res) => {
    try {
        await Notification.deleteMany({ userId: req.user.id });
        res.json({ msg: 'Notifications cleared' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
