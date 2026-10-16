export function getAdminUiHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QPG Admin - Payment Verification Portal</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0b0f19;
      --card: #111827;
      --card-border: #1f2937;
      --primary: #6366f1;
      --primary-hover: #4f46e5;
      --success: #10b981;
      --danger: #ef4444;
      --text: #f9fafb;
      --text-muted: #9ca3af;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    /* Navbar */
    .navbar {
      background: var(--card);
      border-bottom: 1px solid var(--card-border);
      padding: 16px 28px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 800;
      font-size: 1.25rem;
      color: #ffffff;
      letter-spacing: -0.5px;
    }
    .brand-badge {
      background: linear-gradient(135deg, #6366f1, #a855f7);
      color: #fff;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 700;
    }

    /* Container */
    .container {
      max-width: 1200px;
      margin: 28px auto;
      padding: 0 20px;
      width: 100%;
      flex: 1;
    }

    /* Auth Overlay */
    .login-box {
      max-width: 400px;
      margin: 80px auto;
      background: var(--card);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 32px;
      box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5);
    }
    .login-box h2 { margin-bottom: 8px; font-size: 1.5rem; }
    .login-box p { color: var(--text-muted); font-size: 0.9rem; margin-bottom: 24px; }
    .form-group { margin-bottom: 16px; }
    .form-group label { display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 6px; color: var(--text-muted); }
    .form-control {
      width: 100%;
      padding: 10px 14px;
      border-radius: 8px;
      border: 1px solid var(--card-border);
      background: #1f2937;
      color: #fff;
      font-size: 0.95rem;
    }
    .form-control:focus { outline: none; border-color: var(--primary); }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 10px 18px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.9rem;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
      text-decoration: none;
    }
    .btn-primary { background: var(--primary); color: #fff; width: 100%; }
    .btn-primary:hover { background: var(--primary-hover); }
    .btn-success { background: #059669; color: #fff; }
    .btn-success:hover { background: #047857; }
    .btn-danger { background: #dc2626; color: #fff; }
    .btn-danger:hover { background: #b91c1c; }
    .btn-sm { padding: 6px 12px; font-size: 0.8rem; }

    /* Dashboard Header */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .stat-card {
      background: var(--card);
      border: 1px solid var(--card-border);
      border-radius: 10px;
      padding: 20px;
    }
    .stat-title { font-size: 0.85rem; color: var(--text-muted); font-weight: 500; }
    .stat-val { font-size: 1.8rem; font-weight: 800; margin-top: 6px; color: #fff; }

    /* Tabs & Controls */
    .tabs {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;
      border-bottom: 1px solid var(--card-border);
      padding-bottom: 12px;
    }
    .tab-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-weight: 600;
      padding: 6px 14px;
      border-radius: 6px;
      cursor: pointer;
    }
    .tab-btn.active {
      background: #1f2937;
      color: #fff;
    }

    /* Table */
    .table-container {
      background: var(--card);
      border: 1px solid var(--card-border);
      border-radius: 10px;
      overflow-x: auto;
    }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th {
      padding: 14px 18px;
      border-bottom: 1px solid var(--card-border);
      color: var(--text-muted);
      font-size: 0.8rem;
      text-transform: uppercase;
      font-weight: 600;
      background: #0f172a;
    }
    td {
      padding: 14px 18px;
      border-bottom: 1px solid var(--card-border);
      font-size: 0.9rem;
      vertical-align: middle;
    }
    tr:last-child td { border-bottom: none; }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .badge-pending { background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4); }
    .badge-approved { background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); }
    .badge-rejected { background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4); }

    .utr-text {
      font-family: monospace;
      font-weight: 700;
      color: #a5b4fc;
      background: #1e1b4b;
      padding: 2px 6px;
      border-radius: 4px;
    }
  </style>
</head>
<body>

  <nav class="navbar">
    <div class="brand">
      <span>QPG Verification Engine</span>
      <span class="brand-badge">ADMIN v1.0</span>
    </div>
    <div id="nav-user" style="display:none; align-items:center; gap:16px;">
      <span id="admin-email-display" style="font-size:0.85rem; color:var(--text-muted)"></span>
      <button class="btn btn-sm btn-danger" onclick="logout()">Logout</button>
    </div>
  </nav>

  <div class="container">
    <!-- Login Screen -->
    <div id="login-section">
      <div class="login-box">
        <h2>Administrator Sign In</h2>
        <p>Authenticate to review & verify UPI payments for ₹299 subscriptions.</p>
        <div id="login-error" style="color:var(--danger); font-size:0.85rem; margin-bottom:12px; display:none;"></div>
        <div class="form-group">
          <label>Admin Email</label>
          <input type="email" id="login-email" class="form-control" value="admin@qpg.com" />
        </div>
        <div class="form-group">
          <label>Password</label>
          <input type="password" id="login-pass" class="form-control" value="Admin@QPG2026" />
        </div>
        <button class="btn btn-primary" onclick="handleLogin()">Sign In to Dashboard</button>
      </div>
    </div>

    <!-- Main Dashboard -->
    <div id="dashboard-section" style="display:none;">
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-title">Pending Verifications</div>
          <div class="stat-val" id="stat-pending" style="color:#fbbf24;">0</div>
        </div>
        <div class="stat-card">
          <div class="stat-title">Total Approved</div>
          <div class="stat-val" id="stat-approved" style="color:#34d399;">0</div>
        </div>
        <div class="stat-card">
          <div class="stat-title">Monthly Subscription Fee</div>
          <div class="stat-val" style="color:#a5b4fc;">₹299</div>
        </div>
      </div>

      <div class="tabs">
        <button class="tab-btn active" onclick="switchTab('pending')">Pending Verification</button>
        <button class="tab-btn" onclick="switchTab('approved')">Approved Payments</button>
        <button class="tab-btn" onclick="switchTab('rejected')">Rejected</button>
        <button class="tab-btn" onclick="switchTab('audit')">Audit Logs</button>
      </div>

      <div class="table-container">
        <table id="payments-table">
          <thead>
            <tr>
              <th>Date / Time</th>
              <th>Teacher Email</th>
              <th>Subject</th>
              <th>Amount</th>
              <th>UTR / Reference</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="table-body">
            <tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding:32px;">Loading queue...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <script>
    let token = localStorage.getItem('qpg_admin_token');
    let currentFilter = 'pending';
    let allPayments = [];

    window.onload = function() {
      if (token) {
        showDashboard();
      }
    };

    async function handleLogin() {
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-pass').value;
      const errBox = document.getElementById('login-error');
      errBox.style.display = 'none';

      try {
        const resp = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await resp.json();
        if (resp.ok) {
          token = data.token;
          localStorage.setItem('qpg_admin_token', token);
          localStorage.setItem('qpg_admin_email', data.email);
          showDashboard();
        } else {
          errBox.innerText = data.message || 'Login failed';
          errBox.style.display = 'block';
        }
      } catch (err) {
        errBox.innerText = 'Network error connecting to API';
        errBox.style.display = 'block';
      }
    }

    function logout() {
      localStorage.removeItem('qpg_admin_token');
      localStorage.removeItem('qpg_admin_email');
      token = null;
      document.getElementById('dashboard-section').style.display = 'none';
      document.getElementById('nav-user').style.display = 'none';
      document.getElementById('login-section').style.display = 'block';
    }

    function showDashboard() {
      document.getElementById('login-section').style.display = 'none';
      document.getElementById('dashboard-section').style.display = 'block';
      document.getElementById('nav-user').style.display = 'flex';
      document.getElementById('admin-email-display').innerText = localStorage.getItem('qpg_admin_email') || 'admin';
      loadPayments();
    }

    async function loadPayments() {
      try {
        const resp = await fetch('/api/admin/payments', {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        if (resp.status === 401) { logout(); return; }
        const data = await resp.json();
        allPayments = data.requests || [];
        updateStats();
        renderTable();
      } catch (err) {
        console.error(err);
      }
    }

    function updateStats() {
      const pendingCount = allPayments.filter(p => p.status === 'pending').length;
      const approvedCount = allPayments.filter(p => p.status === 'approved').length;
      document.getElementById('stat-pending').innerText = pendingCount;
      document.getElementById('stat-approved').innerText = approvedCount;
    }

    function switchTab(tab) {
      currentFilter = tab;
      document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
      event.target.classList.add('active');
      renderTable();
    }

    function renderTable() {
      const tbody = document.getElementById('table-body');
      const filtered = allPayments.filter(p => currentFilter === 'all' || p.status === currentFilter);

      if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding:32px;">No ' + currentFilter + ' payment requests found.</td></tr>';
        return;
      }

      let html = '';
      for (const p of filtered) {
        const dateStr = new Date(p.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle:'short', timeStyle:'short' });
        const badgeClass = p.status === 'approved' ? 'badge-approved' : (p.status === 'rejected' ? 'badge-rejected' : 'badge-pending');
        
        let actions = '';
        if (p.status === 'pending') {
          actions = \`
            <div style="display:flex; gap:8px;">
              <button class="btn btn-sm btn-success" onclick="approvePayment('\${p.id}')">✓ Approve</button>
              <button class="btn btn-sm btn-danger" onclick="rejectPayment('\${p.id}')">✗ Reject</button>
            </div>
          \`;
        } else if (p.status === 'approved') {
          actions = '<span style="color:#34d399; font-size:0.8rem; font-weight:600;">Active 1 Month</span>';
        } else {
          actions = \`<span style="color:#f87171; font-size:0.8rem;">\${p.rejection_reason || 'Rejected'}</span>\`;
        }

        html += \`
          <tr>
            <td style="color:var(--text-muted);">\${dateStr}</td>
            <td><strong>\${p.user_email}</strong></td>
            <td><span style="background:#1e293b; padding:2px 8px; border-radius:4px; font-size:0.8rem;">\${p.user_subject}</span></td>
            <td><strong>₹\${p.amount}</strong></td>
            <td><span class="utr-text">\${p.utr}</span></td>
            <td><span class="badge \${badgeClass}">\${p.status.toUpperCase()}</span></td>
            <td>\${actions}</td>
          </tr>
        \`;
      }
      tbody.innerHTML = html;
    }

    async function approvePayment(id) {
      if (!confirm('Confirm receipt of ₹299 for this transaction? This will activate 1 calendar month of full premium access.')) return;
      try {
        const resp = await fetch(\`/api/admin/payments/\${id}/approve\`, {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }
        });
        const res = await resp.json();
        if (resp.ok) {
          alert('✓ Payment Approved! Subscription activated for 1 month.');
          loadPayments();
        } else {
          alert('Error: ' + res.message);
        }
      } catch (err) {
        alert('Network error');
      }
    }

    async function rejectPayment(id) {
      const reason = prompt('Enter rejection reason (e.g. UTR not found in bank statement, wrong amount):', 'Transaction reference could not be verified.');
      if (reason === null) return;
      try {
        const resp = await fetch(\`/api/admin/payments/\${id}/reject\`, {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason })
        });
        const res = await resp.json();
        if (resp.ok) {
          alert('Payment rejected.');
          loadPayments();
        } else {
          alert('Error: ' + res.message);
        }
      } catch (err) {
        alert('Network error');
      }
    }
  </script>
</body>
</html>`;
}
