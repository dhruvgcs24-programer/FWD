const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors'); // Essential for connecting front-end and back-end

const app = express();
const PORT = 3000; // Choose any port

// --- 1. Middleware Setup ---
app.use(cors()); // Allows requests from your front-end HTML files
app.use(bodyParser.json()); // To parse JSON bodies from POST requests

// --- 2. MongoDB Connection ---
// NOTE: Replace 'mongodb://localhost:27017/jeevrakshak' with your actual MongoDB connection string
mongoose.connect('mongodb://localhost:27017/jeevrakshak', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('MongoDB connected successfully!');
}).catch(err => {
    console.error('MongoDB connection error:', err);
});

// --- 3. MongoDB Schemas & Models ---

// A. Schema for Hospital Patients (Replaces INITIAL_PATIENTS in hospital.js)
const patientSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true }, // e.g., P1001
    name: { type: String, required: true },
    age: Number,
    room: String, // Ward/Bed
    condition: { type: String, enum: ['Stable', 'Fair', 'Serious', 'Critical'] },
    lastUpdate: String // A simple string for simulation (e.g., '10 min ago')
});
const Patient = mongoose.model('Patient', patientSchema);

// B. Schema for Doctor Requests (Replaces doctor_request_queue in patient.js)
const requestSchema = new mongoose.Schema({
    // id: Number, // Mongoose generates _id, but we can keep id for consistency if needed, though not strictly required
    name: { type: String, required: true }, // Patient Name
    reason: { type: String, required: true },
    criticality: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], required: true },
    timestamp: { type: Date, default: Date.now }
});
const DoctorRequest = mongoose.model('DoctorRequest', requestSchema);


// --- 4. API Endpoints (Routes) ---

// A. Patient Endpoints (Used by hospital.js)
// 1. GET all patients
app.get('/api/patients', async (req, res) => {
    try {
        const patients = await Patient.find({});
        res.json(patients);
    } catch (err) {
        res.status(500).send(err);
    }
});

// 2. POST (Admit) a new patient
app.post('/api/patients', async (req, res) => {
    try {
        const newPatient = new Patient(req.body);
        const savedPatient = await newPatient.save();
        res.status(201).json(savedPatient);
    } catch (err) {
        res.status(400).send(err);
    }
});

// B. Doctor Request Endpoints (Used by patient.js and hospital.js)
// 1. POST (Send) a new doctor request
app.post('/api/requests', async (req, res) => {
    try {
        const newRequest = new DoctorRequest(req.body);
        const savedRequest = await newRequest.save();
        res.status(201).json(savedRequest);
    } catch (err) {
        res.status(400).send(err);
    }
});

// 2. GET all doctor requests (for Hospital Dashboard)
app.get('/api/requests', async (req, res) => {
    try {
        // Sort by criticality (e.g., HIGH first) and then by time
        const requests = await DoctorRequest.find({}).sort({ timestamp: 1 });
        res.json(requests);
    } catch (err) {
        res.status(500).send(err);
    }
});

// 3. DELETE a doctor request (when handled)
app.delete('/api/requests/:id', async (req, res) => {
    try {
        const result = await DoctorRequest.findByIdAndDelete(req.params.id);
        if (result) {
            res.status(200).send({ message: 'Request handled and removed.' });
        } else {
            res.status(404).send({ message: 'Request not found.' });
        }
    } catch (err) {
        res.status(500).send(err);
    }
});

// --- 5. Server Initialization ---
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});