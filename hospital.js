// --- BASE URL for Backend API ---
const API_BASE_URL = 'http://localhost:3000/api';

// --- Helper function to switch views (NO CHANGE to this logic) ---
function showDashboard() {
    document.getElementById('staffing-report-view').style.display = 'none';
    document.getElementById('patient-details-view').style.display = 'none';
    document.getElementById('patient-admission-view').style.display = 'none';
    document.getElementById('main-dashboard-view').style.display = 'flex';
    renderDashboardSummary(); // Re-render summary cards
    renderCriticalAlerts(); // Re-render alerts
}

// --- API-BASED FUNCTION: Handle Patient Admission ---
async function admitPatient(event) {
    event.preventDefault(); // Stop default form submission

    const patientData = {
        id: document.getElementById('new-patient-id').value.trim().toUpperCase(),
        name: document.getElementById('new-patient-name').value.trim(),
        room: document.getElementById('new-patient-ward').value.trim(),
        condition: document.getElementById('new-patient-condition').value,
        age: parseInt(document.getElementById('new-patient-age').value),
        lastUpdate: 'Just Admitted' // Initial status
    };

    if (!patientData.id || !patientData.name || !patientData.room || isNaN(patientData.age)) {
        alert("Please fill in all required fields correctly.");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/patients`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(patientData),
        });

        if (response.status === 400) {
            const error = await response.json();
            alert(`Admission failed: ${error.message || 'ID already exists or invalid data.'}`);
            return;
        }

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        await response.json(); 
        alert(`Patient ${patientData.name} admitted successfully!`);
        
        document.getElementById('patient-admission-form').reset();
        showDashboard();

    } catch (error) {
        console.error('Error admitting patient:', error);
        alert(`Error communicating with the patient database. Is the backend server running on ${API_BASE_URL.replace('/api', '')}? Details: ${error.message}`);
    }
}


// --- API-BASED FUNCTION: Render the Patient Details Report Table (Reads all patients) ---
async function renderPatientDetails() {
    // Show this view
    document.getElementById('main-dashboard-view').style.display = 'none';
    document.getElementById('staffing-report-view').style.display = 'none';
    document.getElementById('patient-admission-view').style.display = 'none';
    document.getElementById('patient-details-view').style.display = 'block';

    const tableBody = document.getElementById('patient-details-table-body');
    tableBody.innerHTML = '<tr><td colspan="6">Loading patient data from database...</td></tr>';

    try {
        const response = await fetch(`${API_BASE_URL}/patients`);
        if (!response.ok) throw new Error('Failed to fetch patient data.');
        
        const patients = await response.json(); 
        
        tableBody.innerHTML = '';

        if (patients.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="no-data">No patients currently admitted.</td></tr>';
            return;
        }

        let tableHTML = '';

        patients.forEach(patient => {
            let conditionColor = '#ccc';
            let conditionType = (patient.condition || '').toLowerCase();

            if (conditionType === 'critical' || conditionType === 'serious') {
                conditionColor = '#e74c3c'; // Red/Serious
            } else if (conditionType === 'stable' || conditionType === 'improving') {
                conditionColor = '#2ecc71'; // Green/Stable
            } else if (conditionType === 'fair') {
                 conditionColor = '#f39c12'; // Orange/Fair
            }
            
            tableHTML += `
                <tr>
                    <td>${patient.id}</td>
                    <td>${patient.name}</td>
                    <td>${patient.age}</td>
                    <td>${patient.room}</td>
                    <td>
                        <span class="status-badge" style="background-color: ${conditionColor};">
                            ${patient.condition}
                        </span>
                    </td>
                    <td>${patient.lastUpdate}</td>
                </tr>
            `;
        });

        tableBody.innerHTML = tableHTML;
        
    } catch (error) {
        console.error('Error fetching patient data:', error);
        tableBody.innerHTML = '<tr><td colspan="6" class="error-data">Error loading patient details. Check console and backend server status.</td></tr>';
    }
}


// --- API-BASED FUNCTION: Render Dashboard Summary Cards (Reads all patients) ---
async function renderDashboardSummary() {
    const totalCountEl = document.getElementById('report-total-patients');
    const criticalCountEl = document.getElementById('report-critical-patients');
    const stableCountEl = document.getElementById('report-stable-patients');

    totalCountEl.textContent = '...';
    criticalCountEl.textContent = '...';
    stableCountEl.textContent = '...';

    try {
        const response = await fetch(`${API_BASE_URL}/patients`);
        if (!response.ok) throw new Error('Failed to fetch patient data for summary.');
        
        const patients = await response.json();
        
        let criticalCount = 0;
        let stableCount = 0;
        let totalCount = patients.length;

        patients.forEach(patient => {
            const conditionType = (patient.condition || '').toLowerCase();
            if (conditionType === 'critical' || conditionType === 'serious') {
                criticalCount++;
            }
            // Include Fair in Stable for the dashboard summary
            if (conditionType === 'stable' || conditionType === 'fair' || conditionType === 'improving') { 
                stableCount++;
            }
        });

        totalCountEl.textContent = totalCount;
        criticalCountEl.textContent = criticalCount;
        // Adjust stable count if it would be more than total - critical
        stableCountEl.textContent = Math.max(0, totalCount - criticalCount); 

    } catch (error) {
        console.error('Error fetching summary data:', error);
        totalCountEl.textContent = 'N/A';
        criticalCountEl.textContent = 'N/A';
        stableCountEl.textContent = 'N/A';
    }
}


// --- API-BASED FUNCTION: Render Critical Alerts (Reads Doctor Requests) ---
async function renderCriticalAlerts() {
    const alertsCard = document.getElementById('critical-alerts-card');
    const defaultAlert = document.getElementById('default-alert');
    let alertsContainer = document.getElementById('alerts-queue-container');

    // Create container if it doesn't exist (important for the dynamic content)
    if (!alertsContainer) {
        alertsContainer = document.createElement('div');
        alertsContainer.id = 'alerts-queue-container';
        alertsCard.appendChild(alertsContainer);
    }
    
    alertsContainer.innerHTML = '';
    
    try {
        const response = await fetch(`${API_BASE_URL}/requests`);
        if (!response.ok) throw new Error('Failed to fetch doctor requests.');
        
        const doctorRequestQueue = await response.json();
        
        if (doctorRequestQueue.length > 0) {
            defaultAlert.style.display = 'none';
            alertsCard.classList.add('critical-active');
            
            // Render the requests
            alertsContainer.innerHTML = doctorRequestQueue.map(request => {
                const id = request._id; // Mongoose uses _id
                const criticalityClass = (request.criticality || 'low').toLowerCase();
                const timeAgo = new Date(request.timestamp).toLocaleTimeString();

                return `
                    <div class="alert-item ${criticalityClass}" data-request-id="${id}">
                        <i class="fas fa-user-injured"></i>
                        <div class="alert-info">
                            <h4>${request.name} <span class="badge ${criticalityClass}">${request.criticality}</span></h4>
                            <p>${request.reason} - <small>(${timeAgo})</small></p>
                        </div>
                        <button class="handle-btn" data-request-id="${id}">Handled</button>
                    </div>
                `;
            }).join('');

            // Re-attach listeners for 'Handled' buttons
            document.querySelectorAll('.handle-btn').forEach(button => {
                button.addEventListener('click', handleRequest);
            });
            
        } else {
            alertsContainer.innerHTML = '';
            defaultAlert.style.display = 'flex';
            alertsCard.classList.remove('critical-active');
        }
        
    } catch (error) {
        console.error('Error fetching critical alerts:', error);
        defaultAlert.style.display = 'none';
        alertsContainer.innerHTML = '<div class="alert-content error"><p>Could not load critical alerts (Server Error).</p></div>';
    }
}

// --- API-BASED FUNCTION: Handle Doctor Request (DELETE) ---
async function handleRequest(event) {
    const requestId = event.target.getAttribute('data-request-id');
    if (!requestId) return;

    const btn = event.target;
    const originalText = btn.textContent;
    btn.textContent = 'Processing...';
    btn.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/requests/${requestId}`, {
            method: 'DELETE',
        });

        if (!response.ok) throw new Error('Failed to delete request from server.');

        // Re-render the alerts after successful deletion
        renderCriticalAlerts();

    } catch (error) {
        console.error('Error handling request:', error);
        alert('Error removing request. Check console.');
        btn.textContent = originalText;
        btn.disabled = false;
    }
}


// -------------------------------------------------------------------
// --- Staffing Report/Oxygen Request Logic (Kept Local/Simulated) ---
// -------------------------------------------------------------------

const DEFAULT_STAFF_COUNTS = { doctors: 12, nurses: 35, admins: 8 };

function getInitialCount(type) {
    const savedCount = localStorage.getItem(`staff_count_${type}`);
    return savedCount ? parseInt(savedCount) : DEFAULT_STAFF_COUNTS[type];
}

function generateRandomStaff(type, count) {
    const names = {
        doctors: ['Dr. Sharma', 'Dr. Reddy', 'Dr. Khan', 'Dr. Patel', 'Dr. Singh'],
        nurses: ['Nurse Jaya', 'Nurse Rani', 'Nurse Ali', 'Nurse Ben', 'Nurse Chloe'],
        admins: ['Admin A', 'Admin B', 'Admin C', 'Admin D', 'Admin E']
    };
    const staffList = [];
    for (let i = 1; i <= count; i++) {
        const name = names[type][Math.floor(Math.random() * names[type].length)];
        staffList.push({
            id: `${type[0].toUpperCase()}${i}`,
            name: name,
            role: type.charAt(0).toUpperCase() + type.slice(1, -1), // Doctor, Nurse, Admin
            status: Math.random() < 0.8 ? 'Available' : 'Busy',
            lastUpdate: `${Math.floor(Math.random() * 60)} min ago`
        });
    }
    return staffList;
}

// Global function used by buttons in hospital.html
function updateStaffCount(type, delta) {
    let currentCount = getInitialCount(type);
    currentCount = Math.max(1, currentCount + delta); // Ensure count is at least 1
    localStorage.setItem(`staff_count_${type}`, currentCount);
    showStaffingReport(); // Re-render the report
}

function showStaffingReport() {
    document.getElementById('main-dashboard-view').style.display = 'none';
    document.getElementById('patient-details-view').style.display = 'none';
    document.getElementById('patient-admission-view').style.display = 'none';
    const reportView = document.getElementById('staffing-report-view');
    reportView.style.display = 'block';

    const doctorsCount = getInitialCount('doctors');
    const nursesCount = getInitialCount('nurses');
    const adminsCount = getInitialCount('admins');

    document.getElementById('report-doctors').textContent = doctorsCount;
    document.getElementById('report-nurses').textContent = nursesCount;
    document.getElementById('report-admins').textContent = adminsCount;

    const allStaff = [
        ...generateRandomStaff('doctors', doctorsCount),
        ...generateRandomStaff('nurses', nursesCount),
        ...generateRandomStaff('admins', adminsCount)
    ];

    const tableBody = document.getElementById('staffing-list-table-body');
    tableBody.innerHTML = '';

    let tableHTML = '';
    allStaff.forEach(staff => {
        const statusClass = staff.status === 'Available' ? 'status-stable' : 'status-critical';
        tableHTML += `
            <tr>
                <td>${staff.id}</td>
                <td>${staff.name}</td>
                <td>${staff.role}</td>
                <td>
                    <span class="status-badge ${statusClass}">
                        ${staff.status}
                    </span>
                </td>
                <td>${staff.lastUpdate}</td>
            </tr>
        `;
    });

    tableBody.innerHTML = tableHTML;
}

function requestCylinders() {
    const quantityInput = document.getElementById('cylinder-quantity');
    const quantity = parseInt(quantityInput.value);
    const adminId = localStorage.getItem('current_admin_id') || 'UNKNOWN_STAFF';

    if (quantity > 0) {
        // This would be a POST request to a /api/inventory route in a real app.
        alert(`Request for ${quantity} oxygen cylinders submitted by Staff ID ${adminId}. (SIMULATED)`); 
        quantityInput.value = 5;
    } else {
        alert("Please enter a valid quantity (1 or more).");
    }
}

// Expose the function globally for buttons (e.g., in staffing view)
window.updateStaffCount = updateStaffCount;


// --- INITIALIZATION AND EVENT LISTENERS (NO CHANGE TO ATTACHMENT LOGIC) ---
document.addEventListener('DOMContentLoaded', () => {

    // 1. Quick Action Button Handlers
    
    document.getElementById('admit-patient-btn').addEventListener('click', (event) => {
        event.preventDefault();
        document.getElementById('main-dashboard-view').style.display = 'none';
        document.getElementById('staffing-report-view').style.display = 'none';
        document.getElementById('patient-details-view').style.display = 'none';
        document.getElementById('patient-admission-view').style.display = 'block';
    });

    document.getElementById('view-reports-btn').addEventListener('click', (event) => {
        event.preventDefault();
        renderPatientDetails();
    });

    document.getElementById('patient-admission-form').addEventListener('submit', admitPatient);

    document.getElementById('request-cylinders-btn').addEventListener('click', requestCylinders);


    // 2. Navbar Link and Back Button Handlers
    
    document.getElementById('staffing-link').addEventListener('click', (event) => {
        event.preventDefault();
        showStaffingReport();
    });
    
    document.getElementById('patient-details-link').addEventListener('click', (event) => {
        event.preventDefault();
        renderPatientDetails(); 
    });

    document.getElementById('back-to-dashboard-btn').addEventListener('click', showDashboard);
    
    document.getElementById('back-to-dashboard-from-patient-btn').addEventListener('click', showDashboard);

    document.getElementById('back-to-dashboard-from-admission-btn').addEventListener('click', showDashboard);
    
    // Initial Load: Render dashboard data
    showDashboard();

    // Set initial staff counts if they don't exist
    if (!localStorage.getItem('staff_count_doctors')) {
        localStorage.setItem('staff_count_doctors', DEFAULT_STAFF_COUNTS.doctors);
        localStorage.setItem('staff_count_nurses', DEFAULT_STAFF_COUNTS.nurses);
        localStorage.setItem('staff_count_admins', DEFAULT_STAFF_COUNTS.admins);
    }
});