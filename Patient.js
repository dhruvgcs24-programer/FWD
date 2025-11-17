// models/Patient.js
const mongoose = require('mongoose');
const patientSchema = new mongoose.Schema({
    patientId: { type: String, required: true, unique: true }, 
    name: { type: String, required: true },
    password: { type: String, required: true }, 
    ward: { type: String, default: 'General' },
    condition: { type: String, default: 'Stable' }, 
    age: Number,
    healthGoals: {
        steps: { type: Number, default: 7500 },
        water: { type: Number, default: 6 },
        sleep: { type: Number, default: 7 }
    }
});
module.exports = mongoose.model('Patient', patientSchema);