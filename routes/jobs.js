const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const User = require('../models/User');
const JobApplication = require('../models/JobApplication');

const auth = require('../middleware/auth');

// Get all jobs
router.get('/', async (req, res) => {
    try {
        const jobs = await Job.find().sort({ createdAt: -1 });
        res.json(jobs);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Get jobs applied by current user
router.get('/applied', auth, async (req, res) => {
    try {
        const applications = await JobApplication.find({ userId: req.user.id }).populate('jobId');
        const appliedJobs = applications.map(app => ({
            ...app.jobId._doc,
            id: app.jobId._id,
            applicationStatus: app.status,
            appliedAt: app.createdAt
        }));
        res.json(appliedJobs);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Apply for a job
router.post('/:id/apply', auth, async (req, res) => {
    try {
        const jobId = req.params.id;
        const userId = req.user.id;

        // Check if job exists
        const job = await Job.findById(jobId);
        if (!job) return res.status(404).json({ message: 'Job not found' });

        // Check if already applied
        let application = await JobApplication.findOne({ jobId, userId });
        if (application) return res.status(400).json({ message: 'Already applied for this job' });

        application = new JobApplication({
            jobId,
            userId
        });

        await application.save();
        res.json({ message: 'Application successful', status: 'Applied' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Add a job
router.post('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const newJob = new Job({
            title: req.body.title,
            company: req.body.company,
            location: req.body.location,
            type: req.body.type,
            postedBy: user.name,
            postedByUserId: req.user.id,
            salary: req.body.salary,
            description: req.body.description,
            requirements: req.body.requirements
        });

        const job = await newJob.save();
        res.json(job);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Delete a job
router.delete('/:id', auth, async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        // Check user
        if (job.postedByUserId.toString() !== req.user.id) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        await job.deleteOne();

        res.json({ message: 'Job removed' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Job not found' });
        }
        res.status(500).send('Server Error');
    }
});

module.exports = router;
