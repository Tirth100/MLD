/**
 * main.js
 * Frontend logic, DOM manipulation, and Chart.js initialization
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- Login Logic ---
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const role = document.getElementById('roleSelect').value;
            const user = document.getElementById('username').value;
            const pass = document.getElementById('password').value;
            
            if (role === 'manager') {
                if(user === 'DevPurohit' && pass === 'test123') {
                    window.location.href = 'pages/manager-dashboard.html';
                } else {
                    alert('Invalid Manager Credentials');
                }
            } else if (role === 'employee') {
                if(user === 'Employee123' && pass === 'demo123') {
                    window.location.href = 'pages/employee-dashboard.html';
                } else {
                    alert('Invalid Employee Credentials');
                }
            }
        });
    }

    // --- Sidebar active state toggle ---
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.sidebar .nav-link');
    navLinks.forEach(link => {
        if(currentPath.includes(link.getAttribute('href'))) {
            link.classList.add('active');
        }
    });

    // --- Load Data Routines ---
    if (document.getElementById('managerDashboard')) {
        loadManagerDashboard();
        setInterval(loadManagerDashboard, 3000);
    }
    if (document.getElementById('analyticsPage')) {
        loadAnalytics();
        setInterval(loadAnalytics, 3000);
    }
    if (document.getElementById('reportsPage')) {
        loadReports();
        setInterval(loadReports, 3000);
    }
    if (document.getElementById('alertsPage')) {
        loadAlerts();
        setInterval(loadAlerts, 3000);
    }
    if (document.getElementById('employeeDashboard')) {
        loadEmployeeDashboard();
        setInterval(loadEmployeeDashboard, 3000);
    }

    // --- Stop Session Button ---
    const stopSessionBtn = document.getElementById('stopSessionBtn');
    if (stopSessionBtn) {
        stopSessionBtn.addEventListener('click', async () => {
            if(confirm("Are you sure you want to officially end the current monitoring session?")) {
                try {
                    await window.api.get('/stop');
                    alert("Session successfully stopped. The final report has been saved.");
                    if(document.getElementById('reportsPage')) loadReports();
                    if(document.getElementById('managerDashboard')) loadManagerDashboard();
                } catch(e) {
                    alert("Error communicating with backend server.");
                }
            }
        });
    }

    // --- Start Session Button ---
    const startSessionBtn = document.getElementById('startSessionBtn');
    if (startSessionBtn) {
        startSessionBtn.addEventListener('click', async () => {
            try {
                await window.api.get('/start');
                alert("Monitoring session started successfully!");
                if(document.getElementById('managerDashboard')) loadManagerDashboard();
            } catch(e) {
                alert("Error starting backend session. Is run.bat running?");
            }
        });
    }

    // --- Connect to Manager Button (Employee) ---
    const connectBtn = document.getElementById('connectManagerBtn');
    if (connectBtn) {
        connectBtn.addEventListener('click', async () => {
            const ip = document.getElementById('managerIpInput').value.trim();
            if (!ip) {
                alert("Please enter a valid IP address.");
                return;
            }
            try {
                // Post to local API to trigger connection to Manager API
                const resp = await fetch('http://localhost:3000/api/connect', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ managerIp: ip })
                });
                const data = await resp.json();
                if (data.success) {
                    const statusEl = document.getElementById('connectionStatus');
                    if(statusEl) statusEl.innerHTML = `<span class="text-success"><i class="bi bi-check-circle-fill me-1"></i>Connected (Local IP: ${data.localIp})</span>`;
                    connectBtn.classList.replace('btn-info', 'btn-success');
                    connectBtn.innerHTML = '<i class="bi bi-check2"></i> Connected';
                } else {
                    alert("Connection failed: " + data.error);
                }
            } catch(e) {
                alert("Error connecting to local server to register.");
            }
        });
    }
});

// Global tracking for Charts so they can be securely destroyed during live polling
let activeCharts = {};

// --- Specific Page Loaders ---

async function loadManagerDashboard() {
    try {
        const data = await window.api.get('/engagement');
        const tbody = document.getElementById('engagementTableBody');
        if(!tbody) return;
        
        // Calculate dynamic metrics
        const uniqueEmployees = new Set(data.map(emp => emp.name)).size;
        const totalMonitoredEl = document.getElementById('totalMonitoredMetricValue');
        if (totalMonitoredEl) totalMonitoredEl.textContent = uniqueEmployees;

        const avgScore = data.length > 0 ? Math.round(data.reduce((acc, emp) => acc + emp.score, 0) / data.length) : 0;
        const avgEngagementEl = document.getElementById('avgEngagementMetricValue');
        if (avgEngagementEl) avgEngagementEl.textContent = `${avgScore}%`;

        // We will update active meetings metric below after hasLiveSession is defined
        tbody.innerHTML = '';
        data.reverse();
        
        // Detect if there's an active live session
        const hasLiveSession = data.some(emp => emp.isLive);
        const stopBtn = document.getElementById('stopSessionBtn');
        const startBtn = document.getElementById('startSessionBtn');
        
        if (stopBtn && startBtn) {
            if (hasLiveSession) {
                stopBtn.classList.remove('d-none');
                startBtn.classList.add('d-none');
            } else {
                stopBtn.classList.add('d-none');
                startBtn.classList.remove('d-none');
            }
        }
        
        const activeMeetingsEl = document.getElementById('activeMeetingsMetricValue');
        if (activeMeetingsEl) activeMeetingsEl.textContent = hasLiveSession ? "1" : "0";

        // Load Available Employees
        const availableEmployees = await window.api.get('/employees');
        const availableTbody = document.getElementById('availableEmployeesTableBody');
        if (availableTbody) {
            availableTbody.innerHTML = '';
            if (availableEmployees.length === 0) {
                availableTbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted py-3">No employees connected yet.</td></tr>';
            } else {
                availableEmployees.forEach(emp => {
                    availableTbody.innerHTML += `
                        <tr>
                            <td><span class="fw-bold">${emp.name}</span></td>
                            <td><code>${emp.ip}</code></td>
                            <td>
                                <button class="btn btn-sm btn-outline-success start-remote-session-btn" data-ip="${emp.ip}"><i class="bi bi-play-circle me-1"></i>Start Session</button>
                                <button class="btn btn-sm btn-outline-danger stop-remote-session-btn ms-2" data-ip="${emp.ip}"><i class="bi bi-stop-circle me-1"></i>Stop Session</button>
                            </td>
                        </tr>
                    `;
                });
                
                // Bind remote start/stop buttons
                document.querySelectorAll('.start-remote-session-btn').forEach(btn => {
                    btn.replaceWith(btn.cloneNode(true));
                });
                document.querySelectorAll('.start-remote-session-btn').forEach(btn => {
                    btn.addEventListener('click', async function() {
                        const ip = this.getAttribute('data-ip');
                        try {
                            const resp = await fetch(`http://${ip}:3000/api/start`);
                            if (resp.ok) alert("Session started for " + ip);
                            else alert("Failed to start session.");
                        } catch(e) { alert("Error reaching employee PC."); }
                    });
                });
                
                document.querySelectorAll('.stop-remote-session-btn').forEach(btn => {
                    btn.replaceWith(btn.cloneNode(true));
                });
                document.querySelectorAll('.stop-remote-session-btn').forEach(btn => {
                    btn.addEventListener('click', async function() {
                        const ip = this.getAttribute('data-ip');
                        if(confirm("Stop session for this employee?")) {
                            try {
                                const resp = await fetch(`http://${ip}:3000/api/stop`);
                                if (resp.ok) alert("Session stopped for " + ip);
                                else alert("Failed to stop session.");
                            } catch(e) { alert("Error reaching employee PC."); }
                        }
                    });
                });
            }
        }

        data.forEach(emp => {
            const statusClass = emp.status === 'engaging' ? 'bg-success' : 
                               (emp.status === 'leeching' ? 'bg-danger' : 'bg-warning');
            const row = `
                <tr>
                    <td>
                        <div class="d-flex align-items-center">
                            <div class="bg-primary rounded-circle text-white d-flex justify-content-center align-items-center me-3" style="width: 40px; height: 40px;">
                                ${emp.name.charAt(0)}
                            </div>
                            <div>
                                <h6 class="mb-0 fw-bold">${emp.name}</h6>
                                <small class="text-muted">${emp.role} ${emp.isLive ? '<span class="text-primary fw-bold ms-1">(Live Session)</span>' : "(" + emp.timestamp + ")"}</small>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div class="progress mt-2">
                            <div class="progress-bar ${statusClass}" role="progressbar" style="width: ${emp.score}%" aria-valuenow="${emp.score}" aria-valuemin="0" aria-valuemax="100"></div>
                        </div>
                        <small class="text-muted mt-1 d-block">${emp.score}%</small>
                    </td>
                    <td>
                        <span class="badge badge-soft-${statusClass.replace('bg-', '')} px-3 py-2 rounded-pill text-capitalize">${emp.status}</span>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });

        // Load recent alerts
        const alerts = await window.api.get('/alerts');
        const alertContainer = document.getElementById('alertNotificationSection');
        if(alertContainer) {
            alertContainer.innerHTML = '';
            alerts.forEach(alert => {
                alertContainer.innerHTML += `
                    <div class="alert-item">
                        <div>
                            <h6 class="mb-1">${alert.name}</h6>
                            <small class="text-muted">${alert.reason}</small>
                        </div>
                        <span class="badge bg-danger rounded-pill">${alert.time}</span>
                    </div>
                `;
            });
            // Update metric count
            const metricValue = document.getElementById('alertsMetricValue');
            if(metricValue) metricValue.textContent = alerts.length;
            
            const navBadges = document.querySelectorAll('#navAlertBadge');
            navBadges.forEach(b => {
                b.textContent = alerts.length;
                if(alerts.length > 0) b.classList.remove('d-none');
                else b.classList.add('d-none');
            });
        }
        
        // Render Latest Meeting Summary (MapReduce format)
        if (data.length > 0) {
            const latestMeeting = data[0]; // data is already reversed, so index 0 is the newest
            const summaryContainer = document.getElementById('latestMeetingSummarySection');
            const scoreBadge = document.getElementById('latestMeetingScoreBadge');
            
            if (summaryContainer && scoreBadge && latestMeeting.timeline) {
                scoreBadge.textContent = `${latestMeeting.score}% Engagement`;
                scoreBadge.className = `badge ms-2 ${latestMeeting.score >= 50 ? 'bg-success' : 'bg-danger'}`;
                
                // MapReduce Algorithm
                const frequencies = {};
                latestMeeting.timeline.forEach(item => {
                    const win = item.window || "Unknown Window";
                    frequencies[win] = (frequencies[win] || 0) + 1;
                });
                
                // Sort by frequency descending
                const sortedApps = Object.entries(frequencies).sort((a, b) => b[1] - a[1]);
                
                let html = '<div class="d-flex flex-wrap gap-3 mt-2">';
                sortedApps.forEach(([app, count]) => {
                    // Display format: App Name - Count
                    // Clean up app name for display if it's too long
                    const shortName = app.length > 40 ? app.substring(0, 40) + '...' : app;
                    html += `
                        <div class="border border-secondary rounded px-3 py-2 bg-light shadow-sm">
                            <span class="fw-medium text-dark">${shortName}</span>
                            <span class="badge bg-secondary ms-2">${count}</span>
                        </div>
                    `;
                });
                html += '</div>';
                
                if(sortedApps.length === 0) {
                    summaryContainer.innerHTML = '<div class="text-muted text-center py-4">No window activity recorded yet.</div>';
                } else {
                    summaryContainer.innerHTML = html;
                }
            }
        }
        
    } catch (e) {
        console.error("Failed to load dashboard data", e);
        const tbody = document.getElementById('engagementTableBody');
        if(tbody) tbody.innerHTML = '<tr><td colspan="3" class="text-center text-danger py-4"><i class="bi bi-exclamation-triangle-fill me-2"></i>Backend server offline. Please run run.bat to view live data.</td></tr>';
    }
}

async function loadAnalytics() {
    try {
        const data = await window.api.get('/analytics');
        
        // Window Focus Pie Chart
        const ctxPie = document.getElementById('focusPieChart');
        if(ctxPie) {
            if(activeCharts.pie) activeCharts.pie.destroy();
            let pData = data.windowFocus;
            if(pData[0] === 0 && pData[1] === 0 && pData[2] === 0) pData = [0, 0, 1]; // Draw minimal background if totally empty
            activeCharts.pie = new Chart(ctxPie, {
                type: 'doughnut',
                data: {
                    labels: ['Focused', 'Blurred', 'Background/Hidden'],
                    datasets: [{
                        data: pData,
                        backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                        borderWidth: 0,
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom', labels: { color: '#1e293b' } }, animation: {duration: 0} }
                }
            });
        }

        // Chat Bar Chart
        const ctxBar = document.getElementById('chatBarChart');
        if(ctxBar) {
            if(activeCharts.bar) activeCharts.bar.destroy();
            activeCharts.bar = new Chart(ctxBar, {
                type: 'bar',
                data: {
                    labels: ['10m', '20m', '30m', '40m', '50m', '60m'],
                    datasets: [{
                        label: 'Messages Sent',
                        data: data.chatActivity,
                        backgroundColor: '#0ea5e9',
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: {duration: 0},
                    scales: {
                        y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.1)' }, ticks: { color: '#1e293b' } },
                        x: { grid: { display: false }, ticks: { color: '#1e293b' } }
                    },
                    plugins: { legend: { display: false } }
                }
            });
        }

        // Speaking Line Chart
        const ctxLine = document.getElementById('speakingLineChart');
        if(ctxLine) {
            if(activeCharts.line) activeCharts.line.destroy();
            activeCharts.line = new Chart(ctxLine, {
                type: 'line',
                data: {
                    labels: data.speakingTime,
                    datasets: [{
                        label: 'Speaking Duration (s)',
                        data: data.speakingData,
                        borderColor: '#7c3aed',
                        backgroundColor: 'rgba(124, 58, 237, 0.1)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: {duration: 0},
                    scales: {
                        y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.1)' }, ticks: { color: '#1e293b' } },
                        x: { grid: { color: 'rgba(0,0,0,0.1)' }, ticks: { color: '#1e293b' } }
                    },
                    plugins: { legend: { display: false } }
                }
            });
        }

    } catch(e) {
        console.error("Failed to load analytics", e);
    }
}

async function loadReports() {
    try {
        const data = await window.api.get('/engagement');
        const tbody = document.getElementById('reportsTableBody');
        if(!tbody) return;
        
        tbody.innerHTML = '';
        data.reverse();
        data.forEach(emp => {
            const statusClass = emp.status === 'engaging' ? 'success' : 
                              (emp.status === 'leeching' ? 'danger' : 'warning');
            
            // Safely embed timeline data using JSON stringified attribute
            const safeTimelineStr = encodeURIComponent(JSON.stringify(emp.timeline || []));
            
            tbody.innerHTML += `
                <tr>
                    <td>${emp.name}</td>
                    <td>${emp.role}</td>
                    <td>${emp.score}%</td>
                    <td>
                        <span class="badge badge-soft-${statusClass} px-3 py-2 rounded-pill text-capitalize">${emp.status}</span>
                    </td>
                    <td><small class="text-muted">${emp.timestamp || 'N/A'}</small></td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary action-btn" data-timeline="${safeTimelineStr}">Actions</button>
                        <button class="btn btn-sm btn-outline-danger delete-btn ms-2" data-timestamp="${emp.timestamp}">Delete</button>
                    </td>
                </tr>
            `;
        });
        
        // Re-bind Action Modal Triggers (since DOM was refreshed)
        bindActionButtons();
        bindDeleteButtons();

        // Export CSV Logic
        const exportBtn = document.getElementById('exportCsvBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                const link = document.createElement("a");
                link.setAttribute("href", "http://localhost:3000/api/export");
                link.setAttribute("download", "engagement_report.csv");
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            });
        }
    } catch(e) {
        console.error("Failed to load reports", e);
        const tbody = document.getElementById('reportsTableBody');
        if(tbody) tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger py-4"><i class="bi bi-exclamation-triangle-fill me-2"></i>Backend server offline. Please run run.bat to view reports.</td></tr>';
    }
}

async function loadAlerts() {
    try {
        const data = await window.api.get('/alerts');
        const container = document.getElementById('alertsListContainer');
        if(!container) return;

        container.innerHTML = '';
        data.forEach(alert => {
            container.innerHTML += `
                <div class="col-md-6 mb-4 alert-card">
                    <div class="card glass-card h-100 border-start border-danger border-4">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <h5 class="card-title mb-0 fw-bold">${alert.name}</h5>
                                <span class="badge bg-danger rounded-pill px-3 py-2">Low Engagement</span>
                            </div>
                            <p class="card-text text-muted mb-3">${alert.reason}</p>
                            <div class="d-flex justify-content-between align-items-center mt-auto">
                                <small class="text-secondary"><i class="bi bi-clock me-1"></i>${alert.time}</small>
                                <button class="btn btn-sm btn-outline-danger dismiss-btn">Dismiss</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        // Update nav badges
        const navBadges = document.querySelectorAll('#navAlertBadge');
        navBadges.forEach(b => {
            b.textContent = data.length;
            if(data.length > 0) b.classList.remove('d-none');
            else b.classList.add('d-none');
        });

        // Add event listeners for dismiss buttons
        const dismissBtns = container.querySelectorAll('.dismiss-btn');
        dismissBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const card = this.closest('.alert-card');
                if (card) {
                    card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.9)';
                    setTimeout(() => card.remove(), 300);
                }
            });
        });

    } catch(e) {
        console.error("Failed to load alerts", e);
    }
}

async function loadEmployeeDashboard() {
    try {
        const data = await window.api.get('/employee-stats');
        
        // Update meeting status
        const statusEl = document.getElementById('meetingStatus');
        if(statusEl) statusEl.textContent = data.meetingStatus;

        // Update overall score
        const scoreBar = document.getElementById('overallScoreBar');
        const scoreText = document.getElementById('overallScoreText');
        if(scoreBar) {
            scoreBar.style.width = `${data.score}%`;
            scoreBar.setAttribute('aria-valuenow', data.score);
            scoreBar.className = `progress-bar progress-bar-striped progress-bar-animated ${data.score < 50 ? 'bg-danger' : 'bg-success'}`;
        }
        if(scoreText) scoreText.textContent = `${data.score}%`;

        // Update sub-scores (Focus, Chat, Speaking)
        document.getElementById('focusScoreVal').textContent = `${data.focus}%`;
        document.getElementById('chatScoreVal').textContent = `${data.chat}%`;
        document.getElementById('speakingScoreVal').textContent = `${data.speaking}%`;
        
        const focusBar = document.getElementById('focusBar');
        if(focusBar) focusBar.style.width = `${data.focus}%`;
        
        const chatBar = document.getElementById('chatBar');
        if(chatBar) chatBar.style.width = `${data.chat}%`;
        
        const speakingBar = document.getElementById('speakingBar');
        if(speakingBar) speakingBar.style.width = `${data.speaking}%`;
        
        // Fetch and map Employee History
        const engagementData = await window.api.get('/engagement');
        const tbody = document.getElementById('employeeHistoryTableBody');
        if(tbody) {
            tbody.innerHTML = '';
            // Only show history for specific employee to prevent data leakage
            const myHistory = engagementData.filter(emp => emp.name === 'Employee123');
            myHistory.reverse();
            
            if(myHistory.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">No history records found.</td></tr>';
            } else {
                myHistory.forEach(emp => {
                    const statusClass = emp.status === 'engaging' ? 'success' : 
                                      (emp.status === 'leeching' ? 'danger' : 'warning');
                    const safeTimelineStr = encodeURIComponent(JSON.stringify(emp.timeline || []));
                    
                    tbody.innerHTML += `
                        <tr>
                            <td><span class="ps-3">${emp.name}</span></td>
                            <td>${emp.role}</td>
                            <td><span class="fw-bold">${emp.score}%</span></td>
                            <td><span class="badge badge-soft-${statusClass} px-3 py-2 rounded-pill text-capitalize">${emp.status}</span></td>
                            <td><button class="btn btn-sm btn-outline-primary action-btn" data-timeline="${safeTimelineStr}">Actions</button></td>
                        </tr>
                    `;
                });
            }
        }
        
        // Re-bind Action Modal Triggers (since DOM was refreshed)
        bindActionButtons();

    } catch(e) {
        console.error("Failed to load employee stats", e);
    }
}

// Ensure Action modals bind cleanly
function bindActionButtons() {
    document.querySelectorAll('.action-btn').forEach(btn => {
        // Prevent stacking event listeners tightly inside intervals
        btn.replaceWith(btn.cloneNode(true));
    });
    
    document.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const timelineDataStr = decodeURIComponent(this.getAttribute('data-timeline'));
            const timelineData = JSON.parse(timelineDataStr);
            
            const mb = document.getElementById('timelineModalBody');
            if(!mb) return;
            
            mb.innerHTML = '';
            if(timelineData.length === 0) {
                mb.innerHTML = '<tr><td colspan="3" class="text-center text-muted py-4">No timeline activity stored.</td></tr>';
            } else {
                timelineData.forEach((check, index) => {
                    const timeSec = index * 10;
                    const classText = check.focused ? '<span class="text-success fw-bold">Focused</span>' : '<span class="text-danger">Distracted</span>';
                    mb.innerHTML += `
                        <tr>
                            <td class="ps-4">${timeSec}s</td>
                            <td><small class="text-secondary">${check.window}</small></td>
                            <td>${classText}</td>
                        </tr>
                    `;
                });
            }
            
            const timelineModalNode = document.getElementById('timelineModal');
            if(timelineModalNode) {
                const modalInst = new bootstrap.Modal(timelineModalNode);
                modalInst.show();
            }
        });
    });
}

// Bind Delete buttons
function bindDeleteButtons() {
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.replaceWith(btn.cloneNode(true));
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const timestamp = this.getAttribute('data-timestamp');
            if(timestamp && confirm('Are you sure you want to delete this record?')) {
                try {
                    await window.api.delete(`/engagement?timestamp=${encodeURIComponent(timestamp)}`);
                    loadReports(); // Refresh the table
                } catch(e) {
                    console.error("Failed to delete record", e);
                    alert("Error deleting record.");
                }
            }
        });
    });
}
