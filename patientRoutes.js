// routes/patientRoutes.js
const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const { protect, restrictTo } = require('../utils/authMiddleware');
const jwt = require('jsonwebtoken'); // Needed for token verification in middleware

// Simple in-memory queue for SOS requests 
let criticalRequests = []; 

// --- STAFF (Hospital Dashboard) ROUTES ---

// GET /api/patients - Fetch all patients
router.get('/', protect, restrictTo('staff'), async (req, res) => {
    try {
        const patients = await Patient.find().select('-password -__v'); 
        res.json(patients);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch patients.' });
    }
});

// POST /api/patients - Admit new patient
router.post('/', protect, restrictTo('staff'), async (req, res) => {
    const { patientId, name, password, ward, condition, age } = req.body;
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password || 'patient123', salt);

        const newPatient = new Patient({
            patientId,
            name,
            password: hashedPassword,
            ward,
            condition,
            age
        });
        const savedPatient = await newPatient.save();
        res.status(201).json(savedPatient);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Patient ID already exists.' });
        }
        res.status(400).json({ message: 'Error admitting patient.', details: error.message });
    }
});

// GET /api/patients/requests - Get all critical requests
router.get('/requests', protect, restrictTo('staff'), (req, res) => {
    const sortedRequests = criticalRequests.sort((a, b) => {
        const criticalities = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
        return criticalities[b.criticality] - criticalities[a.criticality];
    });
    res.json(sortedRequests);
});

// --- PATIENT (Patient Dashboard) ROUTES ---

// GET /api/patients/me - Fetch patient's own data
router.get('/me', protect, restrictTo('patient'), async (req, res) => {
    try {
        const patient = await Patient.findOne({ patientId: req.user.id }).select('-password -__v');
        if (!patient) return res.status(404).json({ message: 'Patient not found.' });
        res.json(patient);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch patient data.' });
    }
});

// PUT /api/patients/goals - Update patient's health goals
router.put('/goals', protect, restrictTo('patient'), async (req, res) => {
    try {
        const patient = await Patient.findOneAndUpdate(
            { patientId: req.user.id },
            { $set: { healthGoals: req.body.goals } },
            { new: true }
        ).select('healthGoals');
        if (!patient) return res.status(404).json({ message: 'Patient not found.' });
        res.json(patient.healthGoals);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update goals.' });
    }
});

// POST /api/patients/sos - Create a critical request
router.post('/sos', protect, restrictTo('patient'), async (req, res) => {
    const { reason, criticality } = req.body;
    const patientId = req.user.id; 
    
    const patient = await Patient.findOne({ patientId: patientId });
    if (!patient) return res.status(404).json({ message: 'Patient not found.' });

    const newRequest = {
        id: Date.now(),
        patientId: patientId,
        name: patient.name,
        reason,
        criticality: criticality ? criticality.toUpperCase() : 'MEDIUM',
        timestamp: new Date().toISOString()
    };
    criticalRequests.push(newRequest); 
    res.status(201).json({ message: 'SOS request sent and queued.', request: newRequest });
});

module.exports = router;