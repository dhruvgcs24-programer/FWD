document.addEventListener('DOMContentLoaded', () => {
    // 1. BMI Calculator Logic
    // ... (rest of the BMI logic remains the same) ...

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

    // 2. Daily Goals Toggle Logic (Simple console log and visual feedback)
    const goalCheckboxes = document.querySelectorAll('.goals-card input[type="checkbox"]');

    goalCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (event) => {
            const goalLabel = event.target.nextElementSibling.textContent;
            if (event.target.checked) {
                console.log(`Goal Completed: ${goalLabel}`);
                // You might update a server or database here
            } else {
                console.log(`Goal Reset: ${goalLabel}`);
            }
        });
    });

    // 3. SOS Button Alert - MODIFIED LOGIC
    const sosButton = document.querySelector('.sos-button');
    sosButton.addEventListener('click', () => {
        if (confirm("Are you sure you want to call Emergency Services?")) {
            console.log("SOS triggered! Sending signal to hospital dashboard.");
            // --- SIMULATION START ---
            // In a real application, this would be an API call or WebSocket emit.
            // Here, we just set a property that the hospital HTML/JS can (hypothetically) check.
            localStorage.setItem('critical_sos_alert', 'Patient X triggered SOS at ' + new Date().toLocaleTimeString());
            // --- SIMULATION END ---
            alert("Emergency signal sent (Simulated)");
        }
    });

    // NOTE: The 'Progress At A Glance' chart would typically require a library
    // like Chart.js or a complex SVG/Canvas implementation in JS. The current
    // HTML/CSS only uses simple static bars and a circle.
});