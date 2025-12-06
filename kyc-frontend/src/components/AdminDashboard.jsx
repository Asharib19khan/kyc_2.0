import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HomeIcon, UsersIcon, FileIcon, DollarIcon, ChartIcon,
  SettingsIcon, LogoutIcon, CheckIcon, XIcon, DownloadIcon,
  ShieldIcon, AlertIcon, MenuIcon
} from './Icons';

function AdminDashboard() {
  const [activeSection, setActiveSection] = useState('overview');
  const [verifications, setVerifications] = useState([]);
  const [loanRequests, setLoanRequests] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [stats, setStats] = useState({ users: 0, pending: 0, verified: 0, loans: 0 });
  const [newAdmin, setNewAdmin] = useState({ first: '', last: '', email: '', password: '' });
  const [showModal, setShowModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isSuper = user.role === 'super_admin';

  useEffect(() => {
    if (user.role !== 'admin' && user.role !== 'super_admin') navigate('/login');
    fetchData();
  }, []);

  const fetchData = () => {
    const headers = { 'Authorization': localStorage.getItem('token') };

    fetch('http://localhost:5000/admin/verification-requests', { headers })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setVerifications(data.data);
          // Calculate stats
          setStats(prev => ({
            ...prev,
            pending: data.data.length,
            users: data.data.length  // This could be total users from another endpoint
          }));
        }
      });

    fetch('http://localhost:5000/admin/loan-requests', { headers })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setLoanRequests(data.data);
          setStats(prev => ({ ...prev, loans: data.data.length }));
        }
      });

    if (isSuper) {
      fetch('http://localhost:5000/super/admins', { headers })
        .then(res => res.json())
        .then(data => { if (data.success) setAdmins(data.data) });
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    await fetch('http://localhost:5000/super/add-admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': localStorage.getItem('token')
      },
      body: JSON.stringify({
        first_name: newAdmin.first,
        last_name: newAdmin.last,
        email: newAdmin.email,
        password: newAdmin.password
      })
    });
    setNewAdmin({ first: '', last: '', email: '', password: '' });
    setShowModal(false);
    fetchData();
    alert('✅ Admin created successfully!');
  };

  const deleteAdmin = async (id) => {
    if (!confirm("Delete this admin?")) return;
    await fetch('http://localhost:5000/super/delete-admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': localStorage.getItem('token')
      },
      body: JSON.stringify({ admin_id: id })
    });
    fetchData();
    alert('✅ Admin deleted successfully!');
  };

  const verifyUser = async (user_id, action) => {
    await fetch('http://localhost:5000/admin/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': localStorage.getItem('token')
      },
      body: JSON.stringify({ user_id, action })
    });
    fetchData();
    alert(`✅ User ${action}d successfully!`);
  };

  const decideLoan = async (loan_id, decision) => {
    const res = await fetch('http://localhost:5000/admin/loan-decision', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': localStorage.getItem('token')
      },
      body: JSON.stringify({ loan_id, decision })
    });
    const data = await res.json();
    if (data.success && data.download_url) {
      window.open('http://localhost:5000' + data.download_url, '_blank');
      fetchData();
      alert(`✅ Loan ${decision}d! PDF downloaded.`);
    }
  };

  const exportExcel = async () => {
    const res = await fetch('http://localhost:5000/export/excel', {
      headers: { 'Authorization': localStorage.getItem('token') }
    });
    const data = await res.json();
    if (data.success) {
      window.open('http://localhost:5000' + data.download_url, '_blank');
      alert('✅ Excel report downloaded!');
    }
  };

  const viewDocument = (path) => {
    window.open(`http://localhost:5000/uploads/${path}`, '_blank');
  };

  const logout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className={`dashboard-sidebar ${sidebarOpen ? '' : 'closed'}`}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)',
            borderRadius: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShieldIcon size={24} color="white" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.125rem' }}>KYC Portal</h3>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              {isSuper ? 'Super Admin' : 'Admin'}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <ul className="nav-menu">
          <li className="nav-item">
            <a
              className={`nav-link ${activeSection === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveSection('overview')}
            >
              <HomeIcon className="nav-icon" />
              Overview
            </a>
          </li>

          <li className="nav-item">
            <a
              className={`nav-link ${activeSection === 'verifications' ? 'active' : ''}`}
              onClick={() => setActiveSection('verifications')}
            >
              <FileIcon className="nav-icon" />
              Verifications
              {verifications.length > 0 && (
                <span className="badge badge-warning" style={{ marginLeft: 'auto' }}>
                  {verifications.length}
                </span>
              )}
            </a>
          </li>

          <li className="nav-item">
            <a
              className={`nav-link ${activeSection === 'loans' ? 'active' : ''}`}
              onClick={() => setActiveSection('loans')}
            >
              <DollarIcon className="nav-icon" />
              Loan Requests
              {loanRequests.length > 0 && (
                <span className="badge badge-info" style={{ marginLeft: 'auto' }}>
                  {loanRequests.length}
                </span>
              )}
            </a>
          </li>

          {isSuper && (
            <li className="nav-item">
              <a
                className={`nav-link ${activeSection === 'admins' ? 'active' : ''}`}
                onClick={() => setActiveSection('admins')}
              >
                <UsersIcon className="nav-icon" />
                Admin Management
              </a>
            </li>
          )}

          <li className="nav-item">
            <a
              className={`nav-link ${activeSection === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveSection('analytics')}
            >
              <ChartIcon className="nav-icon" />
              Analytics
            </a>
          </li>
        </ul>

        {/* Footer Actions */}
        <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
          <a className="nav-link" onClick={exportExcel}>
            <DownloadIcon className="nav-icon" />
            Export Excel
          </a>
          <a className="nav-link" onClick={logout}>
            <LogoutIcon className="nav-icon" />
            Logout
          </a>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-main">
        {/* Header */}
        <div className="dashboard-header">
          <div className="flex-between">
            <div>
              <h1 className="dashboard-title">
                {activeSection === 'overview' && 'Dashboard Overview'}
                {activeSection === 'verifications' && 'KYC Verifications'}
                {activeSection === 'loans' && 'Loan Requests'}
                {activeSection === 'admins' && 'Admin Management'}
                {activeSection === 'analytics' && 'Analytics & Reports'}
              </h1>
              <p className="dashboard-subtitle">Welcome back, {user.name}</p>
            </div>
            <button className="btn btn-sm btn-secondary" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <MenuIcon size={20} />
            </button>
          </div>
        </div>

        {/* Overview Section */}
        {activeSection === 'overview' && (
          <div className="fade-in">
            {/* Stats Cards */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-header">
                  <div>
                    <div className="stat-value">{verifications.length}</div>
                    <div className="stat-label">Pending KYC</div>
                  </div>
                  <div className="stat-icon">
                    <FileIcon size={24} />
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <div>
                    <div className="stat-value">{loanRequests.length}</div>
                    <div className="stat-label">Pending Loans</div>
                  </div>
                  <div className="stat-icon">
                    <DollarIcon size={24} />
                  </div>
                </div>
              </div>

              {isSuper && (
                <div className="stat-card">
                  <div className="stat-header">
                    <div>
                      <div className="stat-value">{admins.length}</div>
                      <div className="stat-label">Total Admins</div>
                    </div>
                    <div className="stat-icon">
                      <UsersIcon size={24} />
                    </div>
                  </div>
                </div>
              )}

              <div className="stat-card">
                <div className="stat-header">
                  <div>
                    <div className="stat-value">{verifications.length + loanRequests.length}</div>
                    <div className="stat-label">Total Pending</div>
                  </div>
                  <div className="stat-icon">
                    <AlertIcon size={24} />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Quick Actions</h3>
              </div>
              <div className="card-body">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <button className="btn btn-primary" onClick={() => setActiveSection('verifications')}>
                    <FileIcon size={20} />
                    Review KYC ({verifications.length})
                  </button>
                  <button className="btn btn-primary" onClick={() => setActiveSection('loans')}>
                    <DollarIcon size={20} />
                    Review Loans ({loanRequests.length})
                  </button>
                  {isSuper && (
                    <button className="btn btn-success" onClick={() => {setShowModal(true); setActiveSection('admins');}}>
                      <UsersIcon size={20} />
                      Add Admin
                    </button>
                  )}
                  <button className="btn btn-secondary" onClick={exportExcel}>
                    <DownloadIcon size={20} />
                    Export Data
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Verifications Section */}
        {activeSection === 'verifications' && (
          <div className="fade-in">
            {verifications.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                <FileIcon size={64} style={{ margin: '0 auto 1rem', color: 'var(--color-text-muted)' }} />
                <h3>No Pending Verifications</h3>
                <p style={{ color: 'var(--color-text-muted)' }}>All KYC requests have been processed</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Documents</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {verifications.map(req => (
                      <tr key={req.user_id}>
                        <td>
                          <div><strong>{req.name}</strong></div>
                          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{req.email}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{req.phone}</div>
                        </td>
                        <td>
                          {req.documents.length === 0 ? (
                            <span className="badge badge-warning">No Docs</span>
                          ) : (
                            req.documents.map((doc, idx) => (
                              <div key={idx} style={{ marginBottom: '0.25rem' }}>
                                <a
                                  href="#"
                                  onClick={(e) => { e.preventDefault(); viewDocument(doc.path); }}
                                  style={{ color: 'var(--color-primary)', textDecoration: 'none' }}
                                >
                                  {doc.type}
                                </a>
                                {' '}
                                <span className={`badge badge-${doc.status === 'pending' ? 'warning' : 'success'}`}>
                                  {doc.status}
                                </span>
                              </div>
                            ))
                          )}
                        </td>
                        <td>
                          <span className="badge badge-warning">{req.status}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn-sm btn-success" onClick={() => verifyUser(req.user_id, 'approve')}>
                              <CheckIcon size={16} />
                              Approve
                            </button>
                            <button className="btn btn-sm btn-danger" onClick={() => verifyUser(req.user_id, 'reject')}>
                              <XIcon size={16} />
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Loans Section */}
        {activeSection === 'loans' && (
          <div className="fade-in">
            {loanRequests.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                <DollarIcon size={64} style={{ margin: '0 auto 1rem', color: 'var(--color-text-muted)' }} />
                <h3>No Pending Loan Requests</h3>
                <p style={{ color: 'var(--color-text-muted)' }}>All loan applications have been processed</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Customer</th>
                      <th>Amount</th>
                      <th>Term</th>
                      <th>Purpose</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loanRequests.map(loan => (
                      <tr key={loan.loan_id}>
                        <td><strong>#{loan.loan_id}</strong></td>
                        <td>
                          <div><strong>{loan.customer_name}</strong></div>
                          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{loan.email}</div>
                        </td>
                        <td><strong style={{ color: 'var(--color-success)' }}>${loan.amount.toLocaleString()}</strong></td>
                        <td>{loan.term} months</td>
                        <td>{loan.purpose}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn-sm btn-success" onClick={() => decideLoan(loan.loan_id, 'approve')}>
                              <CheckIcon size={16} />
                              Approve
                            </button>
                            <button className="btn btn-sm btn-danger" onClick={() => decideLoan(loan.loan_id, 'reject')}>
                              <XIcon size={16} />
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Admin Management Section */}
        {activeSection === 'admins' && isSuper && (
          <div className="fade-in">
            <div style={{ marginBottom: '2rem' }}>
              <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                <UsersIcon size={20} />
                Add New Admin
              </button>
            </div>

            <div className="grid grid-3">
              {admins.map(admin => (
                <div key={admin.id} className="card glass-hover" style={{ padding: '1.5rem' }}>
                  <div className="flex-between" style={{ marginBottom: '1rem' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '1.25rem',
                      fontWeight: 'bold'
                    }}>
                      {admin.name.charAt(0)}
                    </div>
                    <button className="btn btn-sm btn-danger" onClick={() => deleteAdmin(admin.id)}>
                      <XIcon size={16} />
                    </button>
                  </div>
                  <h4 style={{ margin: '0 0 0.25rem 0' }}>{admin.name}</h4>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{admin.email}</p>
                  <div style={{ marginTop: '1rem' }}>
                    <span className="badge badge-success">Active</span>
                  </div>
                </div>
              ))}
            </div>

            {admins.length === 0 && (
              <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                <UsersIcon size={64} style={{ margin: '0 auto 1rem', color: 'var(--color-text-muted)' }} />
                <h3>No Admins Yet</h3>
                <p style={{ color: 'var(--color-text-muted)' }}>Create your first admin to get started</p>
              </div>
            )}
          </div>
        )}

        {/* Analytics Section */}
        {activeSection === 'analytics' && (
          <div className="fade-in">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">System Analytics</h3>
              </div>
              <div className="card-body">
                <div className="stats-grid">
                  <div style={{ padding: '1.5rem', background: 'rgba(65, 105, 225, 0.1)', borderRadius: '1rem', border: '1px solid rgba(65, 105, 225, 0.2)' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-primary)' }}>Total Verifications</h4>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{verifications.length}</p>
                  </div>
                  <div style={{ padding: '1.5rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '1rem', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-success)' }}>Total Loans</h4>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{loanRequests.length}</p>
                  </div>
                  {isSuper && (
                    <div style={{ padding: '1.5rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '1rem', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-warning)' }}>Total Admins</h4>
                      <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{admins.length}</p>
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                  <button className="btn btn-primary btn-lg" onClick={exportExcel}>
                    <DownloadIcon size={20} />
                    Download Full Report (Excel)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Admin Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add New Admin</h2>
            </div>
            <div className="modal-body">
              <form onSubmit={handleCreateAdmin}>
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    value={newAdmin.first}
                    onChange={e => setNewAdmin({ ...newAdmin, first: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    value={newAdmin.last}
                    onChange={e => setNewAdmin({ ...newAdmin, last: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={newAdmin.email}
                    onChange={e => setNewAdmin({ ...newAdmin, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    value={newAdmin.password}
                    onChange={e => setNewAdmin({ ...newAdmin, password: e.target.value })}
                    required
                  />
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-success">
                    <CheckIcon size={20} />
                    Create Admin
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
