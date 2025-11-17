// --- Global Configuration ---
const HOSPITAL_API_URL = 'http://localhost:3000/api/patients';
const TOKEN = localStorage.getItem('jwt_token');

// Basic check to ensure a staff token exists
if (!TOKEN || localStorage.getItem('user_role') !== 'staff') {
    window.location.href = 'login.html';
}

// --- API FETCH FUNCTIONS ---

async function getPatients() {
    try {
        const response = await fetch(HOSPITAL_API_URL, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                alert('Session expired or access denied. Redirecting to login.');
                window.location.href = 'login.html';
                return [];
            }
            throw new Error('Failed to fetch patient data.');
        }
        
        const patients = await response.json();
        // Map backend fields to frontend display fields
        return patients.map(p => ({
            id: p.patientId, 
            name: p.name, 
            age: p.age, 
            room: p.ward, 
            condition: p.condition, 
            lastUpdate: 'Just Now' 
        }));
    } catch (error) {
        console.error("Error fetching patients:", error);
        document.getElementById('patient-list-container').innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
        return [];
    }
}

async function admitPatient(event) {
    event.preventDefault();

    const newPatient = {
        patientId: document.getElementById('new-patient-id').value.trim(),
        name: document.getElementById('new-patient-name').value.trim(),
        password: 'patient123', // Default password for new patient
        ward: document.getElementById('new-patient-ward').value.trim(),
        condition: document.getElementById('new-patient-condition').value,
        age: parseInt(document.getElementById('new-patient-age').value)
    };

    try {
        const response = await fetch(HOSPITAL_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TOKEN}`
            },
            body: JSON.stringify(newPatient)
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to admit patient.');

        alert(`Patient ${newPatient.name} (ID: ${newPatient.patientId}) successfully admitted!`);
        document.getElementById('patient-admission-form').reset();
        showDashboard(); 

    } catch (error) {
        console.error("Admission error:", error);
        alert(`Error admitting patient: ${error.message}`);
    }
}

async function fetchCriticalAlerts() {
    try {
        const response = await fetch(`${HOSPITAL_API_URL}/requests`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        
        if (!response.ok) throw new Error('Failed to fetch alerts.');
        
        const alerts = await response.json();
        renderAlerts(alerts);
    } catch (error) {
        console.error("Error fetching alerts:", error);
        renderAlerts([]); 
    }
}


// --- RENDERING FUNCTIONS ---

function renderAlerts(alerts) {
    const container = document.getElementById('alert-content-container') || document.getElementById('default-alert');
    if (!container) return; 

    if (alerts.length === 0) {
        container.innerHTML = `
            <div class="default-alert-message">
                <i class="fas fa-check-circle" style="color: #2ecc71;"></i>
                <p><strong>All clear.</strong> No critical alerts are currently pending.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = alerts.map(alert => `
        <div class="alert-item ${alert.criticality.toLowerCase()}">
            <i class="fas fa-bell"></i>
            <div class="alert-info">
                <h4>${alert.name} - ${alert.patientId}</h4>
                <p>Request: ${alert.reason}</p>
            </div>
            <span class="alert-criticality">${alert.criticality}</span>
        </div>
    `).join('');
}

function renderPatientList(patients) {
    const container = document.getElementById('patient-list-container');
    if (!container) return;

    if (patients.length === 0) {
        container.innerHTML = '<p>No patients admitted yet.</p>';
        return;
    }

    const patientHTML = patients.map(patient => {
        const statusClass = patient.condition.toLowerCase();
        return `
            <li class="patient-item">
                <div class="patient-status ${statusClass}">${patient.condition}</div>
                <div class="patient-details">
                    <h4>${patient.name} (${patient.id})</h4>
                    <p>Age: ${patient.age} | Ward: ${patient.room}</p>
                </div>
                <div class="patient-time">${patient.lastUpdate}</div>
            </li>
        `;
    }).join('');
    
    container.innerHTML = `<ul class="patient-list">${patientHTML}</ul>`;
}

async function showDashboard() {
    const mainView = document.getElementById('main-dashboard-view');
    mainView.innerHTML = `
        <div class="left-column">
            <section class="card critical-alerts" id="critical-alerts-card">
                <h2>Critical Alerts</h2>
                <div class="alert-content" id="alert-content-container">
                    <div class="loading">Loading alerts...</div>
                </div>
            </section>
            
            <section class="card quick-actions">
                <h2>Quick Actions</h2>
                <ul class="quick-actions-list">
                    <li><button id="admit-patient-btn"><i class="fas fa-user-plus"></i> Admit Patient</button></li>
                    <li><button id="view-reports-btn"><i class="fas fa-clipboard-list"></i> View All Reports</button></li>
                    <li><button><i class="fas fa-chart-bar"></i> Daily Metrics</button></li>
                </ul>
            </section>
        </div>
        <div class="right-column">
            <section class="card patient-overview">
                <h2>Patient Overview</h2>
                <div id="patient-list-container">
                    <div class="loading">Loading patients...</div>
                </div>
            </section>
        </div>
    `;

    // Fetch and render data
    const patients = await getPatients();
    renderPatientList(patients);
    fetchCriticalAlerts();

    // Re-attach listeners for newly loaded elements
    document.getElementById('admit-patient-btn').addEventListener('click', (event) => {
        event.preventDefault();
        renderAdmissionForm();
    });
    document.getElementById('view-reports-btn').addEventListener('click', async (event) => {
        event.preventDefault();
        // Fetch fresh patients before rendering details
        const patients = await getPatients(); 
        renderPatientDetails(patients);
    });
}

function renderPatientDetails(patients) {
    const mainView = document.getElementById('main-dashboard-view');
    mainView.innerHTML = `
        <div class="full-width-content">
            <button id="back-to-dashboard-from-patient-btn" class="back-btn"><i class="fas fa-arrow-left"></i> Back to Dashboard</button>
            <section class="card detail-view">
                <h2>Full Patient Details</h2>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Age</th>
                            <th>Ward</th>
                            <th>Condition</th>
                            <th>Last Update</th>
                        </tr>
                    </thead>
                    <tbody id="full-patient-table-body">
                        ${patients.map(p => `
                            <tr>
                                <td>${p.id}</td>
                                <td>${p.name}</td>
                                <td>${p.age}</td>
                                <td>${p.room}</td>
                                <td><span class="status-indicator ${p.condition.toLowerCase()}">${p.condition}</span></td>
                                <td>${p.lastUpdate}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </section>
        </div>
    `;
    document.getElementById('back-to-dashboard-from-patient-btn').addEventListener('click', showDashboard);
}

function renderAdmissionForm() {
    const mainView = document.getElementById('main-dashboard-view');
    mainView.innerHTML = `
        <div class="full-width-content">
            <button id="back-to-dashboard-from-admission-btn" class="back-btn"><i class="fas fa-arrow-left"></i> Back to Dashboard</button>
            <section class="card admission-form-card">
                <h2>Patient Admission Form</h2>
                <form id="patient-admission-form" class="admission-form">
                    <div class="input-group">
                        <label for="new-patient-id">Patient ID:</label>
                        <input type="text" id="new-patient-id" required placeholder="e.g., P9801">
                    </div>
                    <div class="input-group">
                        <label for="new-patient-name">Name:</label>
                        <input type="text" id="new-patient-name" required placeholder="e.g., Anjali Sharma">
                    </div>
                    <div class="input-group">
                        <label for="new-patient-ward">Ward/Bed:</label>
                        <input type="text" id="new-patient-ward" required placeholder="e.g., Ward A, Bed 12">
                    </div>
                    <div class="input-group">
                        <label for="new-patient-condition">Condition:</label>
                        <select id="new-patient-condition" required>
                            <option value="Stable">Stable</option>
                            <option value="Fair">Fair</option>
                            <option value="Serious">Serious</option>
                            <option value="Critical">Critical</option>
                        </select>
                    </div>
                    <div class="input-group">
                        <label for="new-patient-age">Age:</label>
                        <input type="number" id="new-patient-age" min="0" max="120" required placeholder="e.g., 45">
                    </div>
                    <button type="submit" class="submit-btn hospital-btn" id="submit-admission-btn">Admit Patient</button>
                </form>
            </section>
        </div>
    `;
    document.getElementById('patient-admission-form').addEventListener('submit', admitPatient);
    document.getElementById('back-to-dashboard-from-admission-btn').addEventListener('click', showDashboard);
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Initial Load of Dashboard
    showDashboard();

    // 2. Navbar Link Handlers
    document.getElementById('staffing-link').addEventListener('click', (event) => {
        event.preventDefault();
        alert('Staffing Report feature not fully implemented.');
    });
    
    document.getElementById('patient-details-link').addEventListener('click', async (event) => {
        event.preventDefault();
        const patients = await getPatients();
        renderPatientDetails(patients); 
    });
});