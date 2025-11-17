// utils/seedDatabase.js
const bcrypt = require('bcryptjs');
const Patient = require('../models/Patient');
const Staff = require('../models/Staff');

const seedDatabase = async () => {
    try {
        const staffCount = await Staff.countDocuments();
        if (staffCount === 0) {
            const hashedPassword = await bcrypt.hash('staff123', 10);
            await Staff.create({ staffId: 'HOSP001', password: hashedPassword, role: 'Admin' });
            console.log('Seeded Staff: HOSP001');
        }

        const patientCount = await Patient.countDocuments();
        if (patientCount === 0) {
            const hashedPassword = await bcrypt.hash('patient123', 10);
            const initialPatients = [
                { patientId: 'P1001', name: 'Karan S.', age: 34, ward: 'A-101', condition: 'Critical', password: hashedPassword },
                { patientId: 'P1002', name: 'Ria V.', age: 67, ward: 'B-205', condition: 'Stable', password: hashedPassword },
                { patientId: 'P1003', name: 'Manish R.', age: 55, ward: 'C-310', condition: 'Serious', password: hashedPassword }
            ];
            await Patient.insertMany(initialPatients);
            console.log('Seeded Patients: Karan S., Ria V., Manish R. (Password: patient123)');
        }
    } catch (error) {
        console.error('Error seeding database:', error);
    }
};

module.exports = seedDatabase;