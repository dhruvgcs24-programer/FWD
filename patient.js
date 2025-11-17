// --- Global Configuration ---
const API_BASE_URL = 'http://localhost:3000/api';
const TOKEN = localStorage.getItem('jwt_token');

// Basic check to ensure a patient token exists
if (!TOKEN || localStorage.getItem('user_role') !== 'patient') {
    window.location.href = 'login.html';
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

let currentGoals = {};


// --- API FUNCTIONS (Replaces localStorage functions) ---

async function loadPatientData() {
    try {
        const response = await fetch(`${API_BASE_URL}/patients/me`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                alert('Session expired or access denied. Redirecting to login.');
                window.location.href = 'login.html';
            }
            throw new Error('Failed to load patient profile.');
        }
        
        const data = await response.json();
        
        // Update header with patient's name
        document.getElementById('patient-name-display').textContent = data.name;

        // Return the health goals
        return data.healthGoals || DEFAULT_GOALS; 

    } catch (error) {
        console.error("Error loading patient data:", error);
        alert('Could not load your health data from the server, using defaults.');
        return DEFAULT_GOALS;
    }
}

async function saveGoals(goals) {
    currentGoals = goals; // Update local state
    
    try {
        const response = await fetch(`${API_BASE_URL}/patients/goals`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TOKEN}`
            },
            body: JSON.stringify({ goals })
        });
        
        if (!response.ok) throw new Error('Failed to save goals to the server.');

    } catch (error) {
        console.error("Error saving goals:", error);
        alert('Could not sync goals with the server.');
    }
}

// --- SOS HANDLER (Updated to use API) ---
const sosButton = document.querySelector('.sos-button');

sosButton.addEventListener('click', async () => {
    const reason = prompt("What is the nature of your emergency or request?");
    if (!reason) return;

    const criticality = prompt("Please rate criticality (Low, Medium, High)");
    if (!criticality) return;

    try {
        const response = await fetch(`${API_BASE_URL}/patients/sos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TOKEN}` 
            },
            body: JSON.stringify({ reason, criticality })
        });
        
        const data = await response.json();

        if (response.ok) {
            alert(`Doctor request sent successfully (Criticality: ${criticality}). A staff member will connect with you shortly.`);
        } else {
            alert(`Failed to send request: ${data.message || 'Server error.'}`);
        }

    } catch (error) {
        console.error('SOS request failed:', error);
        alert('An error occurred while sending the SOS request. Check server connection.');
    }
});


// --- PROGRESS TRACKING FUNCTIONS ---

function calculateProgress(current, target) {
    return Math.min(100, (current / target) * 100);
}

function calculateOverallProgress(goals) {
    const totalGoalCount = Object.keys(GOAL_TARGETS).length;
    let totalProgress = 0;

    for (const key in goals) {
        const target = GOAL_TARGETS[key];
        const progress = calculateProgress(goals[key], target);
        totalProgress += progress;
    }

    return Math.round(totalProgress / totalGoalCount);
}

function renderGoals(goals) {
    currentGoals = goals;

    const overallProgress = calculateOverallProgress(goals);
    document.getElementById('overall-progress-value').textContent = `${overallProgress}%`;

    for (const key in goals) {
        const target = GOAL_TARGETS[key];
        const current = goals[key];
        const percent = calculateProgress(current, target);
        
        // Handle steps conversion for display only
        const displayValue = key === 'steps' ? (current / 1000) : current;
        const displayTarget = key === 'steps' ? (target / 1000) : target;
        
        document.getElementById(`${key}-value`).textContent = displayValue;
        document.getElementById(`${key}-target`).textContent = displayTarget;
        document.getElementById(`${key}-bar`).style.width = `${percent}%`;
    }
}

// --- INITIALIZATION ---

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Load data from the API
    const initialGoals = await loadPatientData(); 
    
    // 2. Render the loaded data
    renderGoals(initialGoals);
    
    // 3. Attach listeners to the Goal Update buttons
    document.querySelectorAll('.update-goal-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const type = e.currentTarget.getAttribute('data-type');
            const action = e.currentTarget.getAttribute('data-action');
            
            let newValue = currentGoals[type];

            if (type === 'steps') {
                const stepChange = action === 'add' ? 1000 : -1000;
                newValue = Math.max(0, newValue + stepChange);
            } else if (type === 'water') {
                const waterChange = action === 'add' ? 0.5 : -0.5;
                newValue = Math.max(0, newValue + waterChange);
            } else { // sleep
                const sleepChange = action === 'add' ? 1 : -1;
                newValue = Math.max(0, newValue + sleepChange);
            }

            const newGoals = { ...currentGoals, [type]: newValue };
            renderGoals(newGoals);
            saveGoals(newGoals); // Save new state to the API
        });
    });
    
    // Placeholder BMI calculation (no API call, just frontend logic)
    document.querySelector('.calculate-btn').addEventListener('click', () => {
        const heightCm = parseFloat(document.getElementById('height').value);
        const weightKg = parseFloat(document.getElementById('weight').value);
        const resultDiv = document.getElementById('bmi-result');

        if (heightCm > 0 && weightKg > 0) {
            const heightM = heightCm / 100;
            const bmi = weightKg / (heightM * heightM);
            const roundedBmi = bmi.toFixed(1);
            let category = '';

            if (bmi < 18.5) { category = 'Underweight'; }
            else if (bmi < 25) { category = 'Normal Weight'; }
            else if (bmi < 30) { category = 'Overweight'; }
            else { category = 'Obesity'; }

            resultDiv.innerHTML = `Your BMI is <strong>${roundedBmi}</strong> (${category}).`;
        } else {
            resultDiv.innerHTML = 'Please enter valid height and weight.';
        }
    });
});