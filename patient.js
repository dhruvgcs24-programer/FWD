document.addEventListener('DOMContentLoaded', () => {
    // 1. BMI Calculator Logic
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

        // Simple way to display the result (you could use a modal or update the card)
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
        resultDisplay.style.marginTop = '15px';
        resultDisplay.style.fontWeight = 'bold';
       
        // Remove previous result if it exists
        const oldResult = document.getElementById('bmi-result');
        if (oldResult) {
            oldResult.remove();
        }

        bmiCard.appendChild(resultDisplay);
    });

    // --- 2. Daily Goals Toggle Logic (MODIFIED to include counter and bar updates) ---
    const goalCheckboxes = document.querySelectorAll('.goals-card input[type="checkbox"]');
    const goalsCountDisplay = document.getElementById('goals-count');
    const totalGoals = goalCheckboxes.length;

    // Get references to the specific progress bars
    const waterProgressBar = document.getElementById('water-progress');
    const walkProgressBar = document.getElementById('walk-progress');
    const meditateProgressBar = document.getElementById('meditate-progress');
    const cycleProgressBar = document.getElementById('cycle-progress');

    /**
     * Calculates and updates the display count for daily goals.
     */
    function updateGoalProgress() {
        // Count how many checkboxes are checked (completed goals)
        const completedGoals = Array.from(goalCheckboxes).filter(cb => cb.checked).length;
        
        // Update the count text in the HTML
        if (goalsCountDisplay) {
            goalsCountDisplay.textContent = ` (${completedGoals}/${totalGoals} Completed)`;
        }

        // --- Initialize Bar Widths on Load ---
        // This is necessary to ensure the visual state matches the 'checked' attribute on load
        if (waterProgressBar) waterProgressBar.style.width = document.getElementById('water').checked ? '100%' : '0%';
        if (walkProgressBar) walkProgressBar.style.width = document.getElementById('walk').checked ? '100%' : '0%';
        if (meditateProgressBar) meditateProgressBar.style.width = document.getElementById('meditate').checked ? '100%' : '0%';
        if (cycleProgressBar) cycleProgressBar.style.width = document.getElementById('cycle').checked ? '100%' : '0%';
        // --- End Initialization ---
    }

    goalCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (event) => {
            const goalLabel = event.target.nextElementSibling.textContent;
            const isChecked = event.target.checked;
            const targetId = event.target.id;

            if (isChecked) {
                console.log(`Goal Completed: ${goalLabel}`);
            } else {
                console.log(`Goal Reset: ${goalLabel}`);
            }

            // --- Progress Bar Update Logic ---
            // Update the progress bar only if the goal is completed/reset
            switch (targetId) {
                case 'water':
                    if (waterProgressBar) {
                        waterProgressBar.style.width = isChecked ? '100%' : '0%';
                    }
                    break;
                case 'walk':
                    if (walkProgressBar) {
                        walkProgressBar.style.width = isChecked ? '100%' : '0%';
                    }
                    break;
                case 'meditate':
                    if (meditateProgressBar) {
                        meditateProgressBar.style.width = isChecked ? '100%' : '0%';
                    }
                    break;
                case 'cycle':
                    if (cycleProgressBar) {
                        cycleProgressBar.style.width = isChecked ? '100%' : '0%';
                    }
                    break;
            }
            // --- END: Progress Bar Update Logic ---

            // Update the count display after any change
            updateGoalProgress();
        });
    });

    // Initialize the goals count and bars on page load
    updateGoalProgress();


    // 3. SOS Button Alert - MODIFIED LOGIC
    const sosButton = document.querySelector('.sos-button');
    sosButton.addEventListener('click', () => {
        if (confirm("Are you sure you want to call Emergency Services?")) {
            console.log("SOS triggered! Sending signal to hospital dashboard.");
            
            // 1. Get the patient name from localStorage
            const patientName = localStorage.getItem('current_patient_name') || 'Patient X'; // Use Patient X as a fallback
            
            // 2. Use the patient name in the alert message
            const sosMessage = `SOS from Patient ${patientName} triggered at ${new Date().toLocaleTimeString()}`;

            // --- SIMULATION START ---
            // Store the new, patient-specific message
            localStorage.setItem('critical_sos_alert', sosMessage);
            // --- SIMULATION END ---
            alert("Emergency signal sent (Simulated)");
        }
    });

// ... (existing patient.js code) ...

    // NOTE: The 'Progress At A Glance' chart would typically require a library
    // like Chart.js or a complex SVG/Canvas implementation in JS. The current
    // HTML/CSS only uses simple static bars and a circle.
});