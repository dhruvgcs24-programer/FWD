// NEW FUNCTION: Handle Oxygen Cylinder Request (NO CHANGE)
function requestCylinders() {
    const quantityInput = document.getElementById('cylinder-quantity');
    const quantity = parseInt(quantityInput.value);
    
    // Retrieve the Admin ID from local storage
    const adminId = localStorage.getItem('current_admin_id') || 'UNKNOWN_STAFF';

    if (quantity > 0) {
        console.log(`--- OXYGEN CYLINDER REQUEST ---`);
        console.log(`Requested Quantity: ${quantity}`);
        // Requested By Staff ID is sent during the request
        console.log(`Requested By Staff ID: ${adminId}`);
        console.log(`-------------------------------`);
        alert(`Request for ${quantity} oxygen cylinders submitted by Staff ID ${adminId}.`);
        // Optional: Reset input field to default
        quantityInput.value = 5; 
    } else {
        alert("Please enter a valid quantity (1 or more).");
    }
}


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

        // --- SOS Alert Persistence (NO CHANGE) ---
        function checkAndDisplaySOS() {
            const sosAlert = localStorage.getItem('critical_sos_alert');
            const alertsCard = document.getElementById('critical-alerts-card');
            
            // Clear existing SOS alert if it exists
            const existingSos = document.getElementById('sos-live-alert');
            if (existingSos) {
                alertsCard.removeChild(existingSos);
            }

            if (sosAlert) {
                // Parse the message to explicitly get the patient name and time
                const match = sosAlert.match(/SOS from Patient (.+) triggered at (.+)/);
                let name = 'Unknown Patient';
                let time = '';

                if (match && match.length === 3) {
                    name = match[1].trim();
                    time = match[2].trim();
                }

                const newAlert = document.createElement('div');
                newAlert.className = 'alert-content';
                newAlert.id = 'sos-live-alert';
                // Display the patient's name directly in the heading
                newAlert.innerHTML = `
                    <i class="fas fa-heart-crack" style="color: #c0392b; font-size: 24px;"></i>
                    <p><strong>🚨 EMERGENCY: SOS from Patient ${name}!</strong> ${time ? `(${time})` : ''}</p>
                `;
                
                // Remove the existing 'No Critical Alerts' message before inserting the new one
                const defaultAlert = document.getElementById('default-alert');
                if (defaultAlert) {
                    defaultAlert.style.display = 'none';
                }
                
                alertsCard.appendChild(newAlert);
                
            } else {
                // Show the default message if no SOS alert is present
                document.getElementById('default-alert').style.display = 'flex';
            }
        }
        
        // --- STAFFING LOGIC (MODIFIED for view toggling) ---
        
        const STAFF_SPECIALIZATIONS = {
            doctors: [
                'General Surgeon', 'Cardiology', 'Emergency Medicine', 'Pediatrics', 
                'Anesthesiology', 'Neurology', 'Internal Medicine', 'Orthopedics'
            ],
            nurses: [
                'ICU', 'ER', 'General Floor', 'OR', 'Trauma', 'Labor & Delivery'
            ],
            admins: [
                'Admissions', 'Billing', 'HR', 'IT Support', 'Records', 'Logistics'
            ]
        };

        const FIRST_NAMES = [
            'Alex', 'Maya', 'Chris', 'Jordan', 'Riley', 'Jamie', 'Skylar', 
            'Taylor', 'Drew', 'Avery', 'Kai', 'Morgan', 'Quinn', 'Rowan'
        ];
        const LAST_NAMES = [
            'Smith', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 
            'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Brown'
        ];

        function getRandomElement(arr) {
            return arr[Math.floor(Math.random() * arr.length)];
        }

        function generateRandomStaff(type, count) {
            const staffList = [];
            const specializationPool = STAFF_SPECIALIZATIONS[type];

            for (let i = 0; i < count; i++) {
                // Generates a random ID like D1234, N5678, A9012
                const id = `${type.slice(0, 1).toUpperCase()}${Math.floor(Math.random() * 9000 + 1000)}`;
                const name = `${getRandomElement(FIRST_NAMES)} ${getRandomElement(LAST_NAMES)}`;
                const specialization = getRandomElement(specializationPool);
                
                staffList.push({ id, name, type, specialization });
            }
            return staffList;
        }

        function showStaffingReport() {
            const dashboardView = document.getElementById('main-dashboard-view');
            const reportView = document.getElementById('staffing-report-view');
            const patientView = document.getElementById('patient-details-view'); // NEW: Get patient view
            
            // Hide dashboard and patient view, show report view
            dashboardView.style.display = 'none';
            patientView.style.display = 'none'; // Hide patient view
            reportView.style.display = 'block';

            // 1. Get current staff counts
            const doctorsCount = getInitialCount('doctors');
            const nursesCount = getInitialCount('nurses');
            const adminsCount = getInitialCount('admins');

            const allStaff = [
                ...generateRandomStaff('doctors', doctorsCount),
                ...generateRandomStaff('nurses', nursesCount),
                ...generateRandomStaff('admins', adminsCount)
            ];
            
            // 2. Build Summary Cards (now built in hospital.html, just update content)
            document.getElementById('report-doctors-count').textContent = doctorsCount;
            document.getElementById('report-nurses-count').textContent = nursesCount;
            document.getElementById('report-admins-count').textContent = adminsCount;
            
            // 3. Build Staff List Table
            let tableHTML = `
                <table class="staffing-list-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Role</th>
                            <th>Specialization</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            allStaff.forEach(staff => {
                tableHTML += `
                    <tr>
                        <td class="staff-id">${staff.id}</td>
                        <td>${staff.name}</td>
                        <td class="staff-type">${staff.type}</td>
                        <td>${staff.specialization}</td>
                    </tr>
                `;
            });

            tableHTML += '</tbody></table>';
            document.getElementById('staffing-list-container').innerHTML = tableHTML;
            
            // 4. Update date
            document.getElementById('report-date').textContent = `(as of ${new Date().toLocaleDateString()})`;
        }
        
        // -------------------------------------------------------------------
        // --- NEW CODE BLOCK FOR PATIENT DETAILS FUNCTIONALITY ---
        // -------------------------------------------------------------------

        // Function to generate a random health status
        function getRandomHealthStatus() {
            const statuses = [
                { status: 'Stable', color: '#2ecc71', type: 'stable' }, // Green
                { status: 'Under Observation', color: '#f39c12', type: 'stable' }, // Orange/Yellow
                { status: 'Improving', color: '#3498db', type: 'stable' }, // Blue
                { status: 'Critical', color: '#e74c3c', type: 'critical' } // Red
            ];
            // Give a 25% chance of being Critical
            const randomIndex = Math.random() < 0.25 ? 3 : Math.floor(Math.random() * 3);
            return statuses[randomIndex];
        }

        // Function to render the patient table and summary cards
        function renderPatientDetails() {
            // Hide other views
            document.getElementById('main-dashboard-view').style.display = 'none';
            document.getElementById('staffing-report-view').style.display = 'none';

            // Show this view
            document.getElementById('patient-details-view').style.display = 'block';

            const container = document.getElementById('patient-details-container');
            const statusMessage = document.getElementById('patient-data-status');

            // 1. Retrieve the list of logged-in patients
            const patients = JSON.parse(localStorage.getItem('logged_in_patients') || '[]');

            container.innerHTML = '';
            let criticalCount = 0;
            let stableCount = 0;
            
            if (patients.length === 0) {
                statusMessage.style.display = 'block';
                document.getElementById('report-total-patients').textContent = 0;
                document.getElementById('report-critical-patients').textContent = 0;
                document.getElementById('report-stable-patients').textContent = 0;
                return;
            }
            
            statusMessage.style.display = 'none'; // Hide the "No patients" message

            // 2. Create the table structure and populate summary counts
            let tableHTML = `
                <table class="staffing-list-table patient-table">
                    <thead>
                        <tr>
                            <th>Patient ID</th>
                            <th>Name</th>
                            <th>Age</th>
                            <th>Room</th>
                            <th>Health Status</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            patients.forEach(patient => {
                const healthStatus = getRandomHealthStatus();
                
                if (healthStatus.type === 'critical') {
                    criticalCount++;
                } else {
                    stableCount++;
                }
                
                tableHTML += `
                    <tr>
                        <td>${patient.id}</td>
                        <td>${patient.name}</td>
                        <td>${patient.age}</td>
                        <td>${patient.room}</td>
                        <td>
                            <span class="status-badge" style="background-color: ${healthStatus.color};">
                                ${healthStatus.status}
                            </span>
                        </td>
                    </tr>
                `;
            });

            tableHTML += `
                    </tbody>
                </table>
            `;

            // 3. Update Summary Cards
            document.getElementById('report-total-patients').textContent = patients.length;
            document.getElementById('report-critical-patients').textContent = criticalCount;
            document.getElementById('report-stable-patients').textContent = stableCount;

            // 4. Insert the table
            container.innerHTML = tableHTML;
        }

        
        // --- Initialization and Event Listeners (MODIFIED) ---
        document.addEventListener('DOMContentLoaded', () => {
            
            // 1. Load Staff Counts from Storage on Page Load
            const staffTypes = ['doctors', 'nurses', 'admins'];
            staffTypes.forEach(type => {
                const countElement = document.getElementById(`${type}-count`);
                const initialCount = getInitialCount(type);
                countElement.textContent = initialCount;
            });

            // 2. Staff Attendance Button Handlers (NO CHANGE)
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
                        if (currentCount > 0) {
                            currentCount -= 1;
                        } else {
                             alert(`Cannot decrement ${type} count below 0.`);
                             return; 
                        }
                    }

                    countElement.textContent = currentCount;
                    saveCount(type, currentCount);
                });
            });

            // 3. Run SOS Check
            checkAndDisplaySOS();
            setInterval(checkAndDisplaySOS, 2000); 
            
            // --- NEW/MODIFIED EVENT LISTENERS FOR VIEW TOGGLING ---
            
            // Toggle to Staffing Report
            document.getElementById('staffing-link').addEventListener('click', (event) => {
                event.preventDefault();
                showStaffingReport();
            });
            
            // Toggle back to Dashboard from Staffing Report
            document.getElementById('back-to-dashboard-btn').addEventListener('click', () => {
                document.getElementById('staffing-report-view').style.display = 'none';
                document.getElementById('main-dashboard-view').style.display = 'flex';
            });
            
            // Toggle to Patient Details Report (NEW)
            document.getElementById('patient-details-link').addEventListener('click', (event) => {
                event.preventDefault();
                renderPatientDetails(); // Call the new rendering function
            });

            // Toggle back to Dashboard from Patient Details (NEW)
            document.getElementById('back-to-dashboard-from-patient-btn').addEventListener('click', () => {
                document.getElementById('patient-details-view').style.display = 'none';
                document.getElementById('main-dashboard-view').style.display = 'flex';
            });
        });