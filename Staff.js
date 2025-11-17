// models/Staff.js
const mongoose = require('mongoose');
const staffSchema = new mongoose.Schema({
    staffId: { type: String, required: true, unique: true }, 
    password: { type: String, required: true }, 
    role: { type: String, default: 'Nurse' } 
});
module.exports = mongoose.model('Staff', staffSchema);