// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Patient = require('../models/Patient');
const Staff = require('../models/Staff');

// Helper function to generate JWT
const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { id, password, role } = req.body;

    try {
        let user;
        if (role === 'staff') {
            user = await Staff.findOne({ staffId: id });
        } else if (role === 'patient') {
            user = await Patient.findOne({ name: id }); 
        }

        if (!user) {
            return res.status(401).json({ message: 'User not found.' });
        }
        
        if (await bcrypt.compare(password, user.password)) {
            const userId = role === 'staff' ? user.staffId : user.patientId;
            return res.json({ 
                token: generateToken(userId, role), 
                role,
                id: userId 
            });
        }

        res.status(401).json({ message: 'Invalid credentials.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

module.exports = router;