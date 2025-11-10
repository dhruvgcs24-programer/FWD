// --- BASE URL for Backend API ---
const API_BASE_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. BMI Calculator Logic ---
    const weightInput = document.getElementById('weight');
    const heightInput = document.getElementById('height');
    const calculateBtn = document.querySelector('.calculate-btn');
    const bmiCard = document.querySelector('.bmi-card');

    calculateBtn.addEventListener('click', () => {
        const weight = parseFloat(weightInput.value); // in kg
        const height = parseFloat(heightInput.value) / 100; // in meters (from cm)

        if (isNaN(weight) || isNaN(height) || height <= 0) {
            alert("Please enter valid weight and height.");
            return;
        }

        const bmi = weight / (height * height);

        const resultDisplay = document.createElement('p');
        resultDisplay.id = 'bmi-result';
       
        let status = '';
        if (bmi < 18.5) {
            status = 'Underweight 😞';
        } else if (bmi >= 18.5 && bmi < 24.9) {
            status = 'Normal Weight 😊';
        } else if (bmi >= 25 && bmi < 29.9) {
            status = 'Overweight 😬';
        } else {
            status = 'Obese 😨';
        }

        resultDisplay.innerHTML = `Your **BMI is ${bmi.toFixed(1)}** (${status})`;
       
        // Remove previous result if it exists
        const oldResult = document.getElementById('bmi-result');
        if (oldResult) {
            oldResult.remove();
        }

        bmiCard.appendChild(resultDisplay);
    });

    // --- 2. Daily Goals Logic (Updated for new HTML structure) ---
    const updateGoalsBtn = document.querySelector('.update-goal-btn');

    // Goal Configuration (Max values based on corrected HTML)
    const GOALS = {
        steps: { inputId: 'steps', barId: 'steps-progress', countId: 'steps-count', max: 10000 },
        water: { inputId: 'water', barId: 'water-progress', countId: 'water-count', max: 8 },
        sleep: { inputId: 'sleep', barId: 'sleep-progress', countId: 'sleep-count', max: 8 }
    };

    function updateGoalProgress() {
        let totalProgress = 0;
        let goalCount = 0;

        for (const key in GOALS) {
            const goal = GOALS[key];
            const value = parseInt(document.getElementById(goal.inputId).value) || 0;
            
            // Cap the value at the max goal for calculation
            const actualValue = Math.min(value, goal.max);
            const percentage = (actualValue / goal.max) * 100;

            // Update the progress bar
            const progressBar = document.getElementById(goal.barId);
            if (progressBar) {
                progressBar.style.width = `${percentage}%`;
            }

            // Update the count display
            const countDisplay = document.getElementById(goal.countId);
            if (countDisplay) {
                 countDisplay.textContent = actualValue;
            }

            // Calculate overall progress based on goals met
            totalProgress += percentage;
            goalCount++;
        }

        const avgProgress = goalCount > 0 ? totalProgress / goalCount : 0;
        
        // Update the overall progress circle
        const progressCircle = document.querySelector('.progress-circle');
        if (progressCircle) {
            // Update the conic gradient to reflect the overall average progress
            progressCircle.style.background = `conic-gradient(var(--progress-fill) ${avgProgress}%, var(--progress-unfill) ${avgProgress}%)`;
            
            const activityLabel = progressCircle.querySelector('.activity-label');
            if (activityLabel) {
                 activityLabel.innerHTML = `<strong>${avgProgress.toFixed(0)}%</strong>Activity`;
            }
        }
    }

    // Event listener for the update button
    updateGoalsBtn.addEventListener('click', updateGoalProgress);

    // Initialize goals on page load
    updateGoalProgress();


    // --- 3. DOCTOR REQUEST LOGIC (Updated to use API) ---
    
    // Get patient name from local storage (set during login, simulates session data)
    const patientName = localStorage.getItem('current_patient_name') || 'Patient User';
    
    // Helper function to send the request to the backend
    async function sendDoctorRequest(requestData) {
        try {
            const response = await fetch(`${API_BASE_URL}/requests`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
            });

            if (!response.ok) {
                const errorData = response.status === 400 ? await response.json() : { message: 'Server responded with an error.' };
                throw new Error(errorData.message || `Failed to send doctor request. Status: ${response.status}`);
            }

            await response.json(); 
            
            alert(`Doctor request sent for ${patientName} (Criticality: ${requestData.criticality}). A staff member will connect with you shortly.`);
        } catch (error) {
            console.error('Error sending doctor request:', error);
            alert(`An error occurred while sending your request. Please ensure the backend server is running on ${API_BASE_URL.replace('/api', '')}. Details: ${error.message}`);
        }
    }

    // Attach event listener to the 'Book Now' button
    const bookNowBtn = document.querySelector('.book-now-btn');
    if (bookNowBtn) {
        bookNowBtn.addEventListener('click', () => {
            const reason = prompt("Please briefly describe your reason for connecting with a doctor:");
            if (!reason) {
                alert("Request cancelled.");
                return;
            }

            let criticality = prompt("How critical is this request? (Low, Medium, High)");
            if (!criticality) {
                alert("Request cancelled.");
                return;
            }
            
            // Prepare data for the backend
            const newRequest = {
                name: patientName,
                reason: reason,
                criticality: criticality.toUpperCase(),
            };

            // Call the new API function
            sendDoctorRequest(newRequest);
        });
    }

    // --- 4. SOS Button Logic (Updated to use API) ---
    const sosButton = document.querySelector('.sos-button');

    sosButton.addEventListener('click', () => {
        // Send a HIGH criticality request to the server
        const sosRequest = {
            name: patientName,
            reason: 'EMERGENCY: Immediate SOS from patient dashboard.',
            criticality: 'HIGH',
        };

        sendDoctorRequest(sosRequest);
        
        // This is a critical action, show a clear visual feedback
        sosButton.style.backgroundColor = '#990000';
        sosButton.textContent = 'ALERT SENT!';
        setTimeout(() => {
            sosButton.style.backgroundColor = '#ff3333';
            sosButton.textContent = 'SOS';
        }, 5000);
    });
});