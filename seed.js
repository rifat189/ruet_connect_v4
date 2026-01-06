require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Job = require('./models/Job');
const Event = require('./models/Event');
const Notification = require('./models/Notification');

const users = [
    {
        name: "Tanvir Ahmed",
        email: "admin@ruet.edu.bd",
        password: "password123",
        role: "Admin",
        department: "CSE",
        batch: "2015",
        bio: "System Administrator managing the RUETConnect platform. Passionate about educational technology and open source.",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin",
        skills: ["System Administration", "Network Security", "Cloud Computing"],
        socialLinks: {
            linkedin: "https://linkedin.com",
            github: "https://github.com",
            website: "https://ruet.edu.bd"
        }
    },
    {
        name: "Rahim Uddin",
        email: "student@ruet.edu.bd",
        password: "password123",
        role: "Student",
        department: "CSE",
        batch: "2019",
        bio: "Undergraduate Student enthusiastic about AI and Machine Learning. Currently working on a thesis related to NLP.",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Student",
        skills: ["Python", "TensorFlow", "React", "Data Structures"],
        projects: [
            {
                id: "p1",
                title: "Smart Attendance System",
                description: "An automated attendance system using facial recognition deployed on Raspberry Pi.",
                link: "https://github.com/student/attendance",
                tags: ["Python", "OpenCV", "IoT"]
            }
        ],
        socialLinks: {
            github: "https://github.com/student",
            linkedin: "https://linkedin.com/in/student"
        }
    },
    {
        name: "Dr. Muhammad Abdul Motin",
        email: "faculty@ruet.edu.bd",
        password: "password123",
        role: "Faculty",
        department: "EEE",
        batch: "2005",
        bio: "Professor of Electronics with 15 years of teaching experience. Research interests include VLSI design and Embedded Systems.",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Faculty",
        skills: ["VLSI", "Embedded Systems", "Digital Signal Processing"],
        experience: [
            {
                id: "e1",
                company: "RUET",
                role: "Professor",
                period: "2010 - Present",
                description: "Teaching undergraduate and graduate courses, supervising research."
            }
        ],
        socialLinks: {
            website: "https://faculty.ruet.ac.bd"
        }
    },
    {
        name: "Nusrat Jahan",
        email: "alumni@ruet.edu.bd",
        password: "password123",
        role: "Alumni",
        department: "ME",
        company: "Tesla",
        position: "Senior Engineer",
        batch: "2010",
        bio: "Senior Mechanical Engineer at Tesla. Expert in automotive design and sustainable energy solutions.",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alumni",
        skills: ["SolidWorks", "Ansys", "Automotive Engineering", "Project Management"],
        experience: [
            {
                id: "e2",
                company: "Tesla",
                role: "Senior Engineer",
                period: "2018 - Present",
                description: "Leading the chassis design team for Model Y."
            },
            {
                id: "e3",
                company: "Toyota",
                role: "Design Engineer",
                period: "2012 - 2018",
                description: "Worked on engine efficiency improvements."
            }
        ],
        socialLinks: {
            linkedin: "https://linkedin.com/in/alumni"
        }
    },

    {
        name: "Brain Station 23",
        email: "hr@techcompany.com",
        password: "password123",
        role: "Company",
        department: "N/A",
        batch: "N/A",
        bio: "Leading Tech Company specializing in enterprise software solutions. Always looking for top talent.",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Company",
        skills: ["Enterprise Software", "Cloud Solutions"],
        socialLinks: {
            website: "https://techcompany.com",
            linkedin: "https://linkedin.com/company/tech"
        }
    }
];

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ruetconnect');
        console.log('MongoDB Connected...');

        // Clear Database
        await User.deleteMany({});
        await Job.deleteMany({});
        await Event.deleteMany({});
        await Notification.deleteMany({});
        console.log('Database Cleared');

        // Create Users
        const salt = await bcrypt.genSalt(10);
        const hashedUsers = await Promise.all(users.map(async (user) => {
            const hashedPassword = await bcrypt.hash(user.password, salt);
            return { ...user, password: hashedPassword };
        }));

        const createdUsers = await User.insertMany(hashedUsers);
        console.log('Users Created');

        const admin = createdUsers.find(u => u.role === 'Admin');
        const company = createdUsers.find(u => u.role === 'Company');
        const alumni = createdUsers.find(u => u.role === 'Alumni');
        const faculty = createdUsers.find(u => u.role === 'Faculty');

        // Create Jobs
        const jobs = [
            {
                title: "Software Engineer",
                company: "Tech Company",
                location: "Dhaka",
                type: "Full-time",
                postedBy: company.name,
                postedByUserId: company._id,
                salary: "80k-120k",
                description: "Looking for a full stack developer.",
                requirements: ["React", "Node.js", "MongoDB"]
            },
            {
                title: "Junior Engineer",
                company: "Tesla",
                location: "Remote",
                type: "Internship",
                postedBy: alumni.name,
                postedByUserId: alumni._id,
                salary: "Unpaid",
                description: "Great learning opportunity.",
                requirements: ["CAD", "Physics"]
            }
        ];
        await Job.insertMany(jobs);
        console.log('Jobs Created');

        // Create Events
        const events = [
            {
                title: "Alumni Reunion 2026",
                date: "2026-12-25",
                time: "10:00 AM",
                type: "Reunion",
                location: "RUET Campus",
                image: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f",
                description: "Annual grand reunion.",
                organizer: admin.name
            },
            {
                title: "Research Seminar",
                date: "2026-05-15",
                time: "02:00 PM",
                type: "Webinar",
                location: "Zoom",
                image: "https://images.unsplash.com/photo-1523580494863-6f3031224c94",
                description: "Deep dive into AI.",
                organizer: faculty.name
            }
        ];
        await Event.insertMany(events);
        console.log('Events Created');

        console.log('Seeding Complete!');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedDB();
