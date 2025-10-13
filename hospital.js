
        // Default values to use if nothing is saved in localStorage
        const DEFAULT_STAFF_COUNTS = {
            doctors: 12,
            nurses: 35,
            admins: 8
        };

        // Helper function to get the correct initial count (saved or default)
        function getInitialCount(type) {
            // localStorage only stores strings, so we parse it back to an integer
            const savedCount = localStorage.getItem(`staff_count_${type}`);
            return savedCount ? parseInt(savedCount) : DEFAULT_STAFF_COUNTS[type];
        }

        // Helper function to save the updated count
        function saveCount(type, count) {
            localStorage.setItem(`staff_count_${type}`, count);
        }

        // --- SOS Alert Persistence (from previous step) ---
        function checkAndDisplaySOS() {
            const sosAlert = localStorage.getItem('critical_sos_alert');
            const alertsCard = document.getElementById('critical-alerts-card');
            
            if (sosAlert) {
                const newAlert = document.createElement('div');
                newAlert.className = 'alert-content';
                newAlert.id = 'sos-live-alert';
                newAlert.innerHTML = `
                    <i class="fas fa-heart-crack" style="color: #c0392b; font-size: 24px;"></i>
                    <p><strong>🚨 EMERGENCY: Patient SOS Alert!</strong> (${sosAlert})</p>
                `;
                
                const existingSos = document.getElementById('sos-live-alert');
                if (existingSos) {
                    existingSos.remove();
                }
                
                // Insert the new alert after the h2
                alertsCard.insertBefore(newAlert, alertsCard.querySelector('h2').nextElementSibling);
                alertsCard.style.backgroundColor = '#ffcccc'; 
            }
        }
        
        document.addEventListener('DOMContentLoaded', () => {
            // --- 1. Load Staff Counts from Storage on Page Load ---
            const staffTypes = ['doctors', 'nurses', 'admins'];
            staffTypes.forEach(type => {
                const countElement = document.getElementById(`${type}-count`);
                const initialCount = getInitialCount(type);
                countElement.textContent = initialCount;
            });

            // --- 2. Staff Attendance Button Handlers ---
            const controls = document.querySelectorAll('.staff-controls .control-btn');

            controls.forEach(button => {
                button.addEventListener('click', (event) => {
                    const type = event.target.dataset.type;
                    const action = event.target.dataset.action;
                    const countElement = document.getElementById(`${type}-count`);
                    
                    let currentCount = parseInt(countElement.textContent);

                    if (action === 'increment') {
                        currentCount += 1;
                    } else if (action === 'decrement') {
                        // Prevent staff count from going below zero
                        if (currentCount > 0) {
                            currentCount -= 1;
                        } else {
                             alert(`Cannot decrement ${type} count below 0.`);
                             return; // Stop execution
                        }
                    }

                    // Update the visible count
                    countElement.textContent = currentCount;
                    
                    // SAVE the updated count to local storage for persistence
                    saveCount(type, currentCount);
                });
            });

            // --- 3. Run SOS Check ---
            checkAndDisplaySOS();
            // Optional: Continue checking for SOS in other tabs (simulated real-time)
            setInterval(checkAndDisplaySOS, 2000); 
        });
    