// hospital.js (UPDATED for SOS Alerts and Book Now Queue Separation)

// --- Global Configuration ---
const API_URL = 'http://localhost:3000/api';
const authToken = localStorage.getItem('auth_token');
const REFRESH_INTERVAL = 15000; // 15 seconds for queue auto-update

function redirectToLogin(message = "Session expired. Please log in again.") {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_patient_name');
    localStorage.removeItem('hospital_patients'); // Clear demo data
    alert(message);
    window.location.href = 'login.html';
}

// Check auth on script load
if (!authToken) {
    redirectToLogin("Not logged in. Redirecting...");
}


// Helper function to create standard headers with Authorization
function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
    };
}

// Helper function to format time difference (NEW)
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


// --- 1. Doctor Request/Alerts Functions (CORE LOGIC OVERHAUL) ---

/**
 * Fetches the current pending doctor requests from the backend API.
 */
async function fetchDoctorRequests() {
    try {
        const response = await fetch(`${API_URL}/doctor-requests`, { headers: getAuthHeaders() });
        
        if (response.status === 401 || response.status === 403) {
            redirectToLogin("Access denied or session expired.");
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

/**
 * Renders SOS requests into the Critical Alerts section.
 */
function renderSOSAlerts(requests) {
    const alertsContainer = document.getElementById('critical-alerts-content');
    if (!alertsContainer) return;
    
    // Filter for SOS requests (Type: SOS)
    const sosRequests = requests.filter(r => r.type && r.type.toUpperCase() === 'SOS');
    
    alertsContainer.innerHTML = '';
    
    if (sosRequests.length > 0) {
        sosRequests.forEach(request => {
            const timeAgo = formatTimeDifference(request.timestamp);
            const criticality = request.criticality ? request.criticality.toUpperCase() : 'HIGH';
            alertsContainer.innerHTML += `
                <div class="alert-item sos-alert" data-request-id="${request.id}">
                    <i class="fas fa-exclamation-triangle"></i>
                    <div class="alert-info">
                        <h4>SOS! ${request.name} - ${criticality} PRIORITY</h4>
                        <p>Reason: ${request.reason || 'Immediate Assistance Required'}</p>
                    </div>
                    <span class="alert-time">${timeAgo}</span>
                    <button class="action-btn resolve" onclick="resolveRequest('${request.id}')">Acknowledge</button>
                </div>
            `;
        });
        
    } else {
         // Default (No Critical Alerts)
         alertsContainer.innerHTML = `
            <div class="alert-item default-alert">
                <i class="fas fa-check-circle"></i>
                <p><strong>Patient Status:</strong> All critical patients stable. No new SOS alerts.</p>
            </div>
        `;
    }
    // Update summary card count for all doctor requests (SOS + BOOK_NOW)
    document.getElementById('report-doctor-requests').textContent = requests.length; 
}


/**
 * Renders standard "Book Now" requests into the Request Queue section.
 */
function renderBookNowQueue(requests) {
    const queueContainer = document.getElementById('request-queue-content');
    const queueCountBadge = document.getElementById('queue-count-badge');
    if (!queueContainer || !queueCountBadge) return;
    
    // **MODIFICATION HERE**: Filter for 'BOOK_NOW' or 'DOCTOR_CONNECT' types (or requests with no type specified)
    const queueRequests = requests.filter(r => 
        !r.type || 
        r.type.toUpperCase() === 'BOOK_NOW' ||
        r.type.toUpperCase() === 'DOCTOR_CONNECT' // Include the type used by the server
    );

    queueContainer.innerHTML = ''; // Clear existing queue items
    queueCountBadge.textContent = queueRequests.length;

    if (queueRequests.length === 0) {
        queueContainer.innerHTML = '<p class="empty-queue-message">No pending doctor requests.</p>';
        return;
    }

    // Sort requests: Criticality (HIGH > MEDIUM > LOW), then by time (oldest first)
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
        // Use patientName and reason fields from the database entry
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


/**
 * Sends a request to the backend to mark a doctor request as resolved.
 */
async function resolveRequest(requestId) {
     if (!confirm(`Are you sure you want to resolve request ID: ${requestId}?`)) {
        return;
    }

    try {
        // Assuming the server uses the ObjectID in the URL, as it should
        const response = await fetch(`${API_URL}/doctor-request/${requestId}/resolve`, {
            method: 'PUT',
            headers: getAuthHeaders(),
        });
        
        if (response.status === 401 || response.status === 403) {
            redirectToLogin("Access denied or session expired.");
            return;
        }

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }
        
        // Re-fetch and re-render the queue immediately
        loadAndRenderRequests();
        alert(`Request ${requestId} resolved.`);

    } catch (error) {
        console.error('Error resolving request:', error);
        alert('Failed to resolve request. Check console for details.');
    }
}

// Global function to load and render both alerts and queue
async function loadAndRenderRequests() {
    const requests = await fetchDoctorRequests();
    
    // Separate rendering for SOS and BOOK_NOW
    renderSOSAlerts(requests);
    renderBookNowQueue(requests);
}

// --- 2. Patient List/Admission Functions (EXISTING LOGIC) ---

// Default patient data list for demonstration (for patient list view)
const INITIAL_PATIENTS = [
    { id: 'P1001', name: 'Karan S.', age: 34, room: 'A-101', condition: 'Critical', lastUpdate: '10 min ago' },
    { id: 'P1002', name: 'Ria V.', age: 67, room: 'B-205', condition: 'Stable', lastUpdate: '2 min ago' },
    { id: 'P1003', name: 'Manish R.', age: 55, room: 'C-310', condition: 'Serious', lastUpdate: '25 min ago' },
    { id: 'P1004', name: 'Sarah L.', age: 22, room: 'A-105', condition: 'Fair', lastUpdate: '1 hour ago' },
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


async function fetchPatients() {
    // This is still a placeholder for the patient list view
    return getPatients(); 
}

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
        const conditionClass = `condition-${patient.condition.toLowerCase()}`;

        row.innerHTML = `
            <td>${patient.id}</td>
            <td>${patient.name}</td>
            <td>${patient.age}</td>
            <td>${patient.room}</td>
            <td class="${conditionClass}">${patient.condition}</td>
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


// --- 3. View Management Functions ---

function showView(viewId) {
    // Hide all view-specific sections
    document.getElementById('main-dashboard-view').style.display = 'none'; // The main container
    document.getElementById('patient-details-view').style.display = 'none';
    document.getElementById('patient-admission-view').style.display = 'none';
    document.getElementById('staffing-report-view').style.display = 'none';
    
    // Show the requested section
    const requestedView = document.getElementById(viewId);
    if (requestedView) {
        // Since main-dashboard-view is the main container, show it only if other views are not requested.
        // If we are showing a sub-view (like patient details), we need to handle the display logic carefully.
        if (viewId === 'patient-details-view' || viewId === 'patient-admission-view' || viewId === 'staffing-report-view') {
            document.getElementById('main-dashboard-view').style.display = 'none';
            requestedView.style.display = 'block';
        } else if (viewId === 'main-dashboard-view') {
            requestedView.style.display = 'flex'; // Assuming dashboard is a flex container
        }
    }
}

function showDashboard() {
    showView('main-dashboard-view');
    // CRITICAL: Call the load function on dashboard load
    loadAndRenderRequests(); 
}

function renderPatientDetails() {
    renderPatientList();
}

function showStaffingReport() {
    showView('staffing-report-view');
}


// --- Initialization ---

document.addEventListener('DOMContentLoaded', () => {

    if (!authToken) return; 

    // Initial load of dashboard and data
    showDashboard(); 

    // Set up auto-refresh for the doctor requests queue (CRITICAL ADDITION)
    setInterval(loadAndRenderRequests, REFRESH_INTERVAL); 

    // --- Event Listeners (Linking HTML to JS) ---
    
    // Quick Actions
    document.getElementById('admit-patient-btn').addEventListener('click', (event) => {
        event.preventDefault();
        showView('patient-admission-view');
    });

    document.getElementById('view-reports-btn').addEventListener('click', (event) => {
        event.preventDefault();
        renderPatientDetails();
    });

    document.getElementById('patient-admission-form').addEventListener('submit', admitPatient);

    // Navbar Links
    document.getElementById('staffing-link').addEventListener('click', (event) => {
        event.preventDefault();
        showStaffingReport();
    });
    
    document.getElementById('patient-details-link').addEventListener('click', (event) => {
        event.preventDefault();
        renderPatientDetails(); 
    });
    
    // Back Buttons
    document.getElementById('back-to-dashboard-btn').addEventListener('click', showDashboard);
    document.getElementById('back-to-dashboard-from-patient-btn').addEventListener('click', showDashboard);
    document.getElementById('back-to-dashboard-from-admission-btn').addEventListener('click', showDashboard);
    
    // Logout Button (Assuming a logout button exists in the header, though not in provided HTML)
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => redirectToLogin("You have been logged out."));
    }
});