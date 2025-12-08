// patient.js (COMPLETE LOGIC)

// --- Global Configuration ---
const API_URL = 'http://localhost:3000/api';
const patientName = localStorage.getItem('current_patient_name');
const authToken = localStorage.getItem('auth_token');

// Redirect if not logged in
if (!patientName || !authToken) {
     redirectToLogin("Please log in.");
}

// --- GOAL TRACKER CONFIGURATION ---
const GOAL_TARGETS = {
    steps: 10000,
    water: 8, // Liters
    sleep: 8  // Hours
};

const DEFAULT_GOALS = {
    steps: 7500,
    water: 6,
    sleep: 7
};

// --- API & DATA FUNCTIONS ---

function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
    };
}

function redirectToLogin(message = "Session expired. Please log in again.") {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_patient_name');
    localStorage.removeItem('patient_latitude');
    localStorage.removeItem('patient_longitude');
    alert(message);
    window.location.href = 'login.html';
}

async function fetchGoals(name) {
    try {
        const response = await fetch(`${API_URL}/goals/${encodeURIComponent(name)}`, { headers: getAuthHeaders() });
        
        if (response.status === 404) {
            // Patient has no stored goals, return defaults (no need to alert/redirect)
            return DEFAULT_GOALS;
        }

        if (response.status === 401 || response.status === 403) {
             redirectToLogin("Session expired. Please log in again.");
             return DEFAULT_GOALS;
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json(); 
    } catch (error) {
        console.error('Error fetching patient goals:', error);
        return DEFAULT_GOALS;
    }
}

async function updateGoalsAPI(goals) {
    try {
        const response = await fetch(`${API_URL}/goals`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ goals }) // Server uses the token to find the patient
        });

        if (response.status === 401 || response.status === 403) {
            redirectToLogin("Session expired. Please log in again.");
            return false;
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return true;
    } catch (error) {
        console.error('Error updating goals:', error);
        alert("Failed to save goals to the server.");
        return false;
    }
}


// --- PROGRESS CALCULATION & RENDERING ---

function calculateProgress(current, target) {
    return Math.min(100, (current / target) * 100);
}

function calculateOverallProgress(goals) {
    // Safety check: ensure all targets are > 0 to prevent division by zero
    const stepsTarget = GOAL_TARGETS.steps > 0 ? GOAL_TARGETS.steps : 1;
    const waterTarget = GOAL_TARGETS.water > 0 ? GOAL_TARGETS.water : 1;
    const sleepTarget = GOAL_TARGETS.sleep > 0 ? GOAL_TARGETS.sleep : 1;

    const stepPct = calculateProgress(goals.steps, stepsTarget);
    const waterPct = calculateProgress(goals.water, waterTarget);
    const sleepPct = calculateProgress(goals.sleep, sleepTarget);

    return Math.round((stepPct + waterPct + sleepPct) / 3);
}

async function renderProgress() {
    const goals = await fetchGoals(patientName);
    
    // Calculate overall progress
    const overallProgress = calculateOverallProgress(goals);
    document.getElementById('overall-progress-value').textContent = `${overallProgress}%`;
    // Update the progress circle visualization using CSS custom properties
    document.querySelector('.progress-circle').style.setProperty('--progress-degree', `${overallProgress * 3.6}deg`);

    // Render individual goals and progress bars
    document.getElementById('steps-progress').style.width = `${calculateProgress(goals.steps, GOAL_TARGETS.steps)}%`;
    document.getElementById('steps-current').textContent = goals.steps;
    document.getElementById('steps-target').textContent = GOAL_TARGETS.steps;
    
    document.getElementById('water-progress').style.width = `${calculateProgress(goals.water, GOAL_TARGETS.water)}%`;
    document.getElementById('water-current').textContent = goals.water;
    document.getElementById('water-target').textContent = GOAL_TARGETS.water;

    document.getElementById('sleep-progress').style.width = `${calculateProgress(goals.sleep, GOAL_TARGETS.sleep)}%`;
    document.getElementById('sleep-current').textContent = goals.sleep;
    document.getElementById('sleep-target').textContent = GOAL_TARGETS.sleep;

    // Set form initial values
    document.getElementById('steps-input').value = goals.steps;
    document.getElementById('water-input').value = goals.water;
    document.getElementById('sleep-input').value = goals.sleep;
}


// --- BUTTON HANDLERS ---

// 1. Goal Update Button Handler
async function handleGoalUpdate(event) {
    event.preventDefault(); 
    
    const steps = parseInt(document.getElementById('steps-input').value) || 0;
    const water = parseFloat(document.getElementById('water-input').value) || 0;
    const sleep = parseFloat(document.getElementById('sleep-input').value) || 0;

    const newGoals = { steps, water, sleep };

    const success = await updateGoalsAPI(newGoals);
    
    if (success) {
        alert("Goals updated successfully and saved to the server!");
        renderProgress(); // Re-render dashboard with new goals
    }
}

// 2. BMI Calculation Button Handler
function handleBmiCalculation() {
    const weight = parseFloat(document.getElementById('weight-input').value);
    const heightCm = parseFloat(document.getElementById('height-input').value); // Input is in cm

    if (isNaN(weight) || isNaN(heightCm) || weight <= 0 || heightCm <= 0) {
        document.getElementById('bmi-result').innerHTML = "<p style='color: #e74c3c;'>Please enter valid weight and height.</p>";
        return;
    }

    const heightM = heightCm / 100; // Convert cm to meters
    const bmi = weight / (heightM * heightM);

    let category = '';
    let color = '';

    if (bmi < 18.5) {
        category = 'Underweight';
        color = '#f39c12';
    } else if (bmi >= 18.5 && bmi < 24.9) {
        category = 'Normal weight';
        color = '#2ecc71';
    } else if (bmi >= 25 && bmi < 29.9) {
        category = 'Overweight';
        color = '#e67e22';
    } else {
        category = 'Obesity';
        color = '#e74c3c';
    }

    document.getElementById('bmi-result').innerHTML = `
        <p>Your BMI is: <strong style="color: ${color};">${bmi.toFixed(2)}</strong></p>
        <p>Category: <span style="color: ${color}; font-weight: bold;">${category}</span></p>
    `;
}

// 3. Central Request Handler for Doctor Connect and SOS
async function sendRequest(reason, criticality, type) {
    const patientLat = localStorage.getItem('patient_latitude');
    const patientLng = localStorage.getItem('patient_longitude');
    
    if (!patientLat || !patientLng) {
        alert("Error: Your location was not set during login. Cannot send request. Please log out and log in again, clicking 'Get My Location'.");
        return;
    }
    
    const endpoint = type === 'SOS' ? '/sos-request' : '/doctor-request';

    const requestData = {
        patientName: patientName,
        reason: reason,
        criticality: criticality.toUpperCase(),
        location: {
            lat: parseFloat(patientLat),
            lng: parseFloat(patientLng)
        }
    };

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            // SOS and Doctor Connect endpoints are public for speed/flexibility, 
            // but we can optionally include the token if the backend is updated to require it.
            // For now, we rely on the body data.
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify(requestData)
        });

        const result = await response.json();

        if (response.ok) {
            alert(`${type} Request Sent! The nearest hospital (${result.hospitalName} - ${result.distance.toFixed(2)} km) has been notified.`);
        } else {
            alert(`${type} Request failed: ${result.message || 'Could not dispatch request.'}`);
        }

    } catch (error) {
        console.error(`${type} Request Error:`, error);
        alert(`A network error occurred. Could not connect to the Jeevrakshak server for ${type} request.`);
    }
}


// 4. Doctor Request/Book Now Button Handler
function handleDoctorRequest() {
    const reason = prompt("What is the reason for the doctor request (e.g., headache, follow-up)?");
    if (!reason) {
        alert("Doctor request cancelled.");
        return;
    }

    const criticality = prompt("Enter criticality (LOW, MEDIUM, HIGH):").toUpperCase();
    if (!['LOW', 'MEDIUM', 'HIGH'].includes(criticality)) {
        alert("Invalid criticality. Request cancelled.");
        return;
    }
    
    // **MODIFICATION HERE**: Use 'DOCTOR_CONNECT' type to match server's storage for queue visibility.
    sendRequest(reason.trim(), criticality, 'DOCTOR_CONNECT'); 
}


// 5. SOS Button Handler
function handleSosButton() {
    if (!confirm("🚨 IMMEDIATE EMERGENCY: Are you sure you want to call Emergency Services?")) {
        return;
    }

    const reason = prompt(`SOS Request for ${patientName}: Briefly state the reason for your emergency:`);
    
    if (!reason) {
        alert("SOS request cancelled.");
        return;
    }
    
    // Criticality is assumed HIGH for SOS
    sendRequest(reason.trim(), 'HIGH', 'SOS');
}

// 6. Logout Handler
function handleLogout() {
    redirectToLogin("You have been logged out.");
}


// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    
    renderProgress(); 
    
    // 1. Goal Update Form Button
    document.getElementById('goal-update-form').addEventListener('submit', handleGoalUpdate);
    
    // 2. BMI Calculation Button
    document.querySelector('.calculate-btn').addEventListener('click', handleBmiCalculation);
    
    // 3. Doctor Request/Book Now Button
    document.querySelector('.book-now-btn').addEventListener('click', handleDoctorRequest);

    // 4. SOS Floating Button
    document.querySelector('.sos-button').addEventListener('click', handleSosButton);

    // 5. Logout Button
    document.getElementById('logout-patient-btn').addEventListener('click', handleLogout);
    
    // 6. Patient Name Display (Header)
    const patientNameDisplay = document.querySelector('.user-profile');
    const logoutLink = document.getElementById('logout-patient-btn');
    if (patientNameDisplay && logoutLink) {
        patientNameDisplay.innerHTML = `<i class="fas fa-user-circle"></i> <span id="patient-name-display">${patientName}</span>`;
        patientNameDisplay.appendChild(logoutLink);
    }
});