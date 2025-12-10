// hospital.js (COMPLETE AND FINAL CODE)

// --- Global Configuration ---
const API_URL = 'http://localhost:3000/api';
const authToken = localStorage.getItem('auth_token');
const REFRESH_INTERVAL = 15000; // 15 seconds for queue auto-update

// FIX: Only redirect if necessary. 
function redirectToLogin(message = "Session expired. Please log in again.") {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_patient_name');
    localStorage.removeItem('hospital_patients'); 
    localStorage.removeItem('hospital_staff'); 
    alert(message);
    
    // If the current path is the hospital page, we block the redirect
    const currentPath = window.location.pathname.toLowerCase();
    if (currentPath.includes('hospital.html') || currentPath === '/') {
        console.warn("Auth token missing/expired. Alert triggered, but redirect blocked to remain on dashboard.");
        return; 
    }
    
    window.location.href = 'login.html';
}


// Helper function to create standard headers with Authorization
function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
    };
}

// Helper function to format time difference
function formatTimeDifference(timestamp) {
    const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
    let interval = seconds / 60;

    if (interval >= 60) {
        interval = interval / 60;
        return Math.floor(interval) + (Math.floor(interval) === 1 ? " hr ago" : " hrs ago");
    }
    if (interval >= 1) {
        return Math.floor(interval) + " mins ago";
    }
    if (seconds > 10) {
        return seconds + " secs ago";
    }
    return "just now";
}


// --- 1. Demo Data Functions (Dynamic Data Source) ---

const INITIAL_PATIENTS = [
    { id: 'P1001', name: 'Karan S.', age: 34, room: 'A-101', condition: 'Critical', lastUpdate: '10 min ago' },
    { id: 'P1002', name: 'Ria V.', age: 67, room: 'B-205', condition: 'Stable', lastUpdate: '2 min ago' },
    { id: 'P1003', name: 'Manish R.', age: 55, room: 'C-310', condition: 'Serious', lastUpdate: '25 min ago' },
    { id: 'P1004', name: 'Sarah L.', age: 22, room: 'A-105', condition: 'Fair', lastUpdate: '1 hour ago' },
    { id: 'P1005', name: 'Rahul M.', age: 71, room: 'D-401', condition: 'Stable', lastUpdate: '45 min ago' },
];

const INITIAL_STAFF = [
    { id: 'S201', name: 'Dr. Priya Mehta', role: 'Cardiologist', shift: 'Day', contact: 'x201' },
    { id: 'S202', name: 'Dr. Amit Singh', role: 'Emergency Physician', shift: 'Night', contact: 'x202' },
    { id: 'S305', name: 'Nurse Rina Das', role: 'Charge Nurse', shift: 'Day', contact: 'x305' },
    { id: 'S311', name: 'Nurse Kevin J.', role: 'Floor Nurse', shift: 'Day', contact: 'x311' },
    { id: 'S312', name: 'Nurse Jane Doe', role: 'ICU Nurse', shift: 'Night', contact: 'x312' },
    { id: 'S501', name: 'Admin Ali Khan', role: 'Admissions', shift: 'Day', contact: 'x501' },
];


function getPatients() {
    const patientsJSON = localStorage.getItem('hospital_patients');
    if (patientsJSON) {
        return JSON.parse(patientsJSON);
    } else {
        localStorage.setItem('hospital_patients', JSON.stringify(INITIAL_PATIENTS));
        return INITIAL_PATIENTS;
    }
}

function savePatients(patients) {
    localStorage.setItem('hospital_patients', JSON.stringify(patients));
}

function getStaff() {
    const staffJSON = localStorage.getItem('hospital_staff');
    if (staffJSON) {
        return JSON.parse(staffJSON);
    } else {
        localStorage.setItem('hospital_staff', JSON.stringify(INITIAL_STAFF));
        return INITIAL_STAFF;
    }
}

// --- 2. Request/Alerts Functions (Dashboard Core) ---

async function fetchDoctorRequests() {
    try {
        const response = await fetch(`${API_URL}/doctor-requests`, { headers: getAuthHeaders() });
        
        if (response.status === 401 || response.status === 403) {
            if (authToken) {
                redirectToLogin("Access denied or session expired.");
            }
            return [];
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching doctor requests:', error);
        return []; 
    }
}

function updateDashboardSummary(requests) {
    const sosRequests = requests.filter(r => r.type && r.type.toUpperCase() === 'SOS');
    const bookNowRequests = requests.filter(r => 
        !r.type || 
        r.type.toUpperCase() === 'BOOK_NOW' ||
        r.type.toUpperCase() === 'DOCTOR_CONNECT'
    );
    
    const allPatients = getPatients();
    const totalPatientsServed = allPatients.length; 
    const criticalPatients = allPatients.filter(p => p.condition === 'Critical').length;
    const stablePatients = allPatients.filter(p => p.condition === 'Stable' || p.condition === 'Fair').length;

    document.getElementById('report-total-patients').textContent = totalPatientsServed;
    document.getElementById('report-critical-patients').textContent = sosRequests.length + criticalPatients; 
    document.getElementById('report-stable-patients').textContent = stablePatients;
    document.getElementById('report-doctor-requests').textContent = bookNowRequests.length; 

    document.getElementById('queue-count-badge').textContent = bookNowRequests.length;
}

function renderSOSAlerts(requests) {
    const alertsContainer = document.getElementById('critical-alerts-content');
    if (!alertsContainer) return;
    
    const sosRequests = requests.filter(r => r.type && r.type.toUpperCase() === 'SOS');
    
    alertsContainer.innerHTML = '';
    
    if (sosRequests.length > 0) {
        sosRequests.forEach(request => {
            const timeAgo = formatTimeDifference(request.timestamp);
            const criticality = request.criticality ? request.criticality.toUpperCase() : 'HIGH';
            alertsContainer.innerHTML += `
                <div class="alert-item sos-alert" data-request-id="${request._id}">
                    <i class="fas fa-exclamation-triangle"></i>
                    <div class="alert-info">
                        <h4>SOS! ${request.patientName} - ${criticality} PRIORITY</h4>
                        <p>Reason: ${request.reason || 'Immediate Assistance Required'}</p>
                    </div>
                    <span class="alert-time">${timeAgo}</span>
                    <button class="action-btn resolve" onclick="resolveRequest('${request._id}')">Acknowledge & Resolve</button>
                </div>
            `;
        });
        
    } else {
        alertsContainer.innerHTML = `
            <div class="alert-item default-alert">
                <i class="fas fa-check-circle"></i>
                <p><strong>Patient Status:</strong> All critical patients stable. No new SOS alerts.</p>
            </div>
        `;
    }
}

function renderBookNowQueue(requests) {
    const queueContainer = document.getElementById('request-queue-content');
    const queueCountBadge = document.getElementById('queue-count-badge');
    if (!queueContainer || !queueCountBadge) return;
    
    const queueRequests = requests.filter(r => 
        !r.type || 
        r.type.toUpperCase() === 'BOOK_NOW' ||
        r.type.toUpperCase() === 'DOCTOR_CONNECT'
    );

    queueContainer.innerHTML = ''; 
    queueCountBadge.textContent = queueRequests.length;

    if (queueRequests.length === 0) {
        queueContainer.innerHTML = '<p class="empty-queue-message">No pending doctor requests.</p>';
        return;
    }

    queueRequests.sort((a, b) => {
        const criticalityOrder = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1, 'UNDEFINED': 0 };
        const critA = a.criticality ? a.criticality.toUpperCase() : 'LOW';
        const critB = b.criticality ? b.criticality.toUpperCase() : 'LOW';

        if (criticalityOrder[critB] !== criticalityOrder[critA]) {
            return criticalityOrder[critB] - criticalityOrder[critA];
        }
        return new Date(a.timestamp) - new Date(b.timestamp);
    });

    queueRequests.forEach((request, index) => {
        const patientName = request.patientName || 'Unknown Patient';
        const reason = request.reason || 'Standard Consultation';
        
        const criticality = request.criticality ? request.criticality.toLowerCase() : 'low';
        const priorityClass = `${criticality}-priority`;
        const timeAgo = formatTimeDifference(request.timestamp);
        
        queueContainer.innerHTML += `
            <div class="queue-item" data-request-id="${request._id}">
                <div class="queue-info">
                    <h4 class="patient-name">${index + 1}. ${patientName}</h4>
                    <small class="request-reason">${reason}</small>
                </div>
                <div class="queue-actions">
                    <span class="priority-tag ${priorityClass}">${criticality.toUpperCase()}</span>
                    <span class="request-time">${timeAgo}</span>
                    <button class="action-btn resolve hospital-btn" onclick="resolveRequest('${request._id}')">Resolve</button>
                </div>
            </div>
        `;
    });
}


async function resolveRequest(requestId) {
     if (!confirm(`Are you sure you want to resolve request ID: ${requestId}? This will remove it from the queue.`)) {
         return;
     }

    try {
        const response = await fetch(`${API_URL}/doctor-request/${requestId}/resolve`, {
            method: 'PUT',
            headers: getAuthHeaders(),
        });
        
        if (response.status === 401 || response.status === 403) {
            if (authToken) {
                redirectToLogin("Access denied or session expired.");
            }
            return;
        }

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }
        
        loadAndRenderRequests();
        alert(`Request ${requestId} resolved successfully and removed from the queue.`);

    } catch (error) {
        console.error('Error resolving request:', error);
        alert('Failed to resolve request. Check console for details.');
    }
}

// Global function to load and render both alerts and queue
async function loadAndRenderRequests() {
    const requests = await fetchDoctorRequests();
    
    updateDashboardSummary(requests); 
    renderSOSAlerts(requests);
    renderBookNowQueue(requests);
}

// --- 3. Patient and Staff View Functions (Dynamic Content) ---

function renderPatientList(patients = getPatients()) {
    const tableBody = document.querySelector('#patient-details-table-body');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (patients.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" class="no-data-row">No patient records found.</td></tr>`;
        return;
    }

    patients.forEach(patient => {
        const row = tableBody.insertRow();
        const conditionClass = `status-badge ${patient.condition.toLowerCase()}-priority`;

        row.innerHTML = `
            <td>${patient.id}</td>
            <td>${patient.name}</td>
            <td>${patient.age}</td>
            <td>${patient.room}</td>
            <td><span class="${conditionClass}">${patient.condition}</span></td>
            <td>${patient.lastUpdate}</td>
            <td>
                <button class="action-btn detail">View Profile</button>
            </td>
        `;
    });
    
    showView('patient-details-view');
}

function admitPatient(event) {
    event.preventDefault();
    const id = document.getElementById('new-patient-id').value;
    const name = document.getElementById('new-patient-name').value;
    const age = parseInt(document.getElementById('new-patient-age').value);
    const room = document.getElementById('new-patient-ward').value;
    const condition = document.getElementById('new-patient-condition').value;

    const newPatient = {
        id: id, 
        name: name, 
        age: age, 
        room: room, 
        condition: condition, 
        lastUpdate: 'Just Admitted'
    };
    
    const patients = getPatients();
    if (patients.some(p => p.id === id)) {
        alert("Patient ID already exists.");
        return;
    }
    
    patients.push(newPatient);
    savePatients(patients);
    
    alert(`Patient ${name} admitted successfully.`);
    document.getElementById('patient-admission-form').reset();
    showDashboard(); 
}

// CRITICAL: Dynamic Staff List generation logic
function showStaffingReport() {
    const staff = getStaff();
    
    const doctors = staff.filter(s => s.role.includes('Doctor') || s.role.includes('Physician') || s.role.includes('Surgeon'));
    const nurses = staff.filter(s => s.role.includes('Nurse'));
    const admin = staff.filter(s => s.role.includes('Admin') || s.role.includes('Admissions'));

    // Update summary counts
    document.getElementById('staff-doctors-count').textContent = doctors.length;
    document.getElementById('staff-nurses-count').textContent = nurses.length;
    document.getElementById('staff-admins-count').textContent = admin.length;

    // Render Detailed Staff List table
    const tableBody = document.getElementById('staffing-table-body');
    tableBody.innerHTML = '';
    
    staff.forEach(s => {
        const row = tableBody.insertRow();
        const statusClass = s.shift === 'Day' ? 'status-badge low-priority' : 'status-badge medium-priority';
        const shiftStatus = s.shift === 'Day' ? 'On Duty (Day)' : 'On Duty (Night)';
        
        row.innerHTML = `
            <td>${s.id}</td>
            <td>${s.name}</td>
            <td>${s.role}</td>
            <td><span class="${statusClass}">${shiftStatus}</span></td>
            <td>${s.contact}</td>
        `;
    });

    showView('staffing-report-view');
}

/**
 * Logs the oxygen cylinder request to the console.
 */
function requestCylinders() {
    const quantityInput = document.getElementById('cylinder-quantity');
    const quantity = parseInt(quantityInput.value);
    
    // Placeholder for Hospital ID
    const hospitalId = "HOSP_JVKSHK_001"; 

    if (isNaN(quantity) || quantity <= 0) {
        alert("Please enter a valid quantity of oxygen cylinders (must be 1 or more).");
        return;
    }

    // Log the required information to the console
    console.log("--- Oxygen Cylinder Request Initiated ---");
    console.log(`Hospital ID: ${hospitalId}`);
    console.log(`Requested Quantity: ${quantity} cylinders`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log("-----------------------------------------");
    
    alert(`Request for ${quantity} oxygen cylinders logged to console (Simulation successful).`);
}


// --- 4. View Management Functions ---

function showView(viewId) {
    document.getElementById('main-dashboard-view').style.display = 'none'; 
    document.getElementById('patient-details-view').style.display = 'none';
    document.getElementById('patient-admission-view').style.display = 'none';
    document.getElementById('staffing-report-view').style.display = 'none';
    
    const requestedView = document.getElementById(viewId);
    if (requestedView) {
        if (viewId === 'patient-details-view' || viewId === 'patient-admission-view' || viewId === 'staffing-report-view') {
            document.getElementById('main-dashboard-view').style.display = 'none';
            requestedView.style.display = 'block';
        } else if (viewId === 'main-dashboard-view') {
            requestedView.style.display = 'flex'; 
        }
    }
}

function showDashboard() {
    showView('main-dashboard-view');
    loadAndRenderRequests(); 
}


// --- 5. Initialization ---

document.addEventListener('DOMContentLoaded', () => {

    showDashboard(); 

    setInterval(loadAndRenderRequests, REFRESH_INTERVAL); 

    // --- Event Listeners (Linking HTML to JS) ---
    
    // Fix: Ensure clicking the logo returns to the dashboard
    const dashboardLink = document.querySelector('.logo h1'); 
    if (dashboardLink) {
        dashboardLink.style.cursor = 'pointer';
        dashboardLink.addEventListener('click', showDashboard);
    }
    
    // Quick Actions
    document.getElementById('admit-patient-btn').addEventListener('click', (event) => {
        event.preventDefault();
        showView('patient-admission-view');
    });

    document.getElementById('view-reports-btn').addEventListener('click', (event) => {
        event.preventDefault();
        renderPatientList();
    });

    document.getElementById('patient-admission-form').addEventListener('submit', admitPatient);

    // Navbar Links
    document.getElementById('staffing-link').addEventListener('click', (event) => {
        event.preventDefault();
        showStaffingReport(); 
    });
    
    document.getElementById('patient-details-link').addEventListener('click', (event) => {
        event.preventDefault();
        renderPatientList(); 
    });
    
    // Back Buttons (Navigation Fix)
    document.getElementById('back-to-dashboard-btn').addEventListener('click', (event) => {
        event.preventDefault();
        showDashboard();
    });
    document.getElementById('back-to-dashboard-from-patient-btn').addEventListener('click', (event) => {
        event.preventDefault();
        showDashboard();
    });
    document.getElementById('back-to-dashboard-from-admission-btn').addEventListener('click', (event) => {
        event.preventDefault();
        showDashboard();
    });
});