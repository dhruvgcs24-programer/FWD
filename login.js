// --- Global Configuration ---
const API_BASE_URL = 'http://localhost:3000/api';

function showForm(formId) {
    // Hide all form/choice containers first
    document.querySelectorAll('.form-container, #choice-container').forEach(container => {
        container.style.display = 'none';
    });
    // Show the requested container
    document.getElementById(formId).style.display = 'block';
}

// --- CORE LOGIN LOGIC (Replaces old localStorage logic) ---
async function performLogin(id, password, role) {
    localStorage.clear(); 

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, password, role })
        });

        const data = await response.json();

        if (response.ok) {
            // SUCCESS: Store the JWT and user ID
            localStorage.setItem('jwt_token', data.token);
            localStorage.setItem('user_id', data.id); // Storing patientId or staffId
            localStorage.setItem('user_role', data.role);
            
            if (role === 'patient') {
                window.location.href = 'patient.html';
            } else {
                window.location.href = 'hospital.html';
            }
        } else {
            alert(`Login failed: ${data.message || 'Invalid credentials.'}`);
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('An unexpected error occurred. Check server connection (http://localhost:3000).');
    }
}

function handlePatientLogin(event) {
    event.preventDefault();
    const patientName = document.getElementById('patient-login-name').value.trim();
    const password = document.getElementById('patient-login-password').value.trim();
    performLogin(patientName, password, 'patient');
}

function handleHospitalLogin(event) {
    event.preventDefault();
    const staffId = document.getElementById('hospital-login-id').value.trim();
    const password = document.getElementById('hospital-login-password').value.trim();
    performLogin(staffId, password, 'staff');
}

// Attach event listeners after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initial view
    showForm('choice-container');

    // Attach submit listeners to forms
    document.querySelector('#patient-login-container .auth-form').onsubmit = handlePatientLogin;
    document.querySelector('#hospital-login-container .auth-form').onsubmit = handleHospitalLogin;
});