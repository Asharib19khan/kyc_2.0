import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HomeIcon, FileIcon, DollarIcon, LogoutIcon,
  UploadIcon, CheckIcon, XIcon, AlertIcon,
  CalendarIcon, ShieldIcon, MenuIcon
} from './Icons';

function CustomerDashboard() {
  const [activeSection, setActiveSection] = useState('overview');
  const [loans, setLoans] = useState([]);
  const [amount, setAmount] = useState('');
  const [term, setTerm] = useState('');
  const [purpose, setPurpose] = useState('');
  const [docType, setDocType] = useState('CNIC');
  const [docNumber, setDocNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [file, setFile] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (!user.role || user.role !== 'customer') navigate('/login');
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    const res = await fetch(`http://localhost:5000/customer/loans?user_id=${user.id}`, {
      headers: { 'Authorization': localStorage.getItem('token') }
    });
    const data = await res.json();
    if (data.success) setLoans(data.data);
  };

  const applyLoan = async (e) => {
    e.preventDefault();
    if (user.status !== 'verified') {
      alert('⚠️ You must be verified to apply for a loan.');
      return;
    }

    const res = await fetch('http://localhost:5000/customer/apply-loan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': localStorage.getItem('token')
      },
      body: JSON.stringify({ amount, term, purpose })
    });
    const data = await res.json();
    if (data.success) {
      alert('✅ Loan application submitted successfully!');
      fetchLoans();
      setAmount('');
      setTerm('');
      setPurpose('');
      setActiveSection('loans');
    } else {
      alert('❌ Failed to submit application.');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('doc_type', docType);
    formData.append('doc_number', docNumber);
    formData.append('expiry', expiry);

    const res = await fetch('http://localhost:5000/upload-document', {
      method: 'POST',
      headers: { 'Authorization': localStorage.getItem('token') },
      body: formData
    });
    const data = await res.json();
    if (data.success) {
      alert('✅ Document uploaded successfully!');
      setFile(null);
      setDocNumber('');
      setExpiry('');
      // Reset file input
      document.querySelector('input[type="file"]').value = '';
    } else {
      alert('❌ Upload failed. Please try again.');
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: <span className="badge badge-warning">Pending</span>,
      verified: <span className="badge badge-success">Verified</span>,
      rejected: <span className="badge badge-danger">Rejected</span>,
      approved: <span className="badge badge-success">Approved</span>
    };
    return badges[status] || status;
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
              Customer
            </p>
          </div>
        </div>

        {/* User Info */}
        <div style={{
          padding: '1rem',
          background: 'rgba(65, 105, 225, 0.1)',
          borderRadius: '0.75rem',
          marginBottom: '1.5rem',
          border: '1px solid rgba(65, 105, 225, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
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
              {user.name?.charAt(0) || 'U'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: '600', fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                {getStatusBadge(user.status)}
              </div>
            </div>
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
              className={`nav-link ${activeSection === 'upload' ? 'active' : ''}`}
              onClick={() => setActiveSection('upload')}
            >
              <UploadIcon className="nav-icon" />
              Upload Documents
            </a>
          </li>

          {user.status === 'verified' && (
            <li className="nav-item">
              <a
                className={`nav-link ${activeSection === 'apply' ? 'active' : ''}`}
                onClick={() => setActiveSection('apply')}
              >
                <DollarIcon className="nav-icon" />
                Apply for Loan
              </a>
            </li>
          )}

          <li className="nav-item">
            <a
              className={`nav-link ${activeSection === 'loans' ? 'active' : ''}`}
              onClick={() => setActiveSection('loans')}
            >
              <FileIcon className="nav-icon" />
              My Applications
              {loans.length > 0 && (
                <span className="badge badge-info" style={{ marginLeft: 'auto' }}>
                  {loans.length}
                </span>
              )}
            </a>
          </li>
        </ul>

        {/* Footer */}
        <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
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
                {activeSection === 'overview' && 'Dashboard'}
                {activeSection === 'upload' && 'Upload Documents'}
                {activeSection === 'apply' && 'Apply for Loan'}
                {activeSection === 'loans' && 'My Applications'}
              </h1>
              <p className="dashboard-subtitle">Welcome, {user.name}</p>
            </div>
            <button className="btn btn-sm btn-secondary" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <MenuIcon size={20} />
            </button>
          </div>
        </div>

        {/* Overview Section */}
        {activeSection === 'overview' && (
          <div className="fade-in">
            {/* Status Alert */}
            {user.status === 'pending' && (
              <div style={{
                padding: '1.5rem',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                borderRadius: '1rem',
                marginBottom: '2rem',
                display: 'flex',
                alignItems: 'start',
                gap: '1rem'
              }}>
                <AlertIcon size={24} style={{ color: 'var(--color-warning)', flexShrink: 0, marginTop: '0.25rem' }} />
                <div>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-warning)' }}>Verification Pending</h4>
                  <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
                    Your account is under review. Please upload your documents to complete verification.
                  </p>
                  <button className="btn btn-warning btn-sm" style={{ marginTop: '1rem' }} onClick={() => setActiveSection('upload')}>
                    <UploadIcon size={16} />
                    Upload Documents Now
                  </button>
                </div>
              </div>
            )}

            {user.status === 'verified' && (
              <div style={{
                padding: '1.5rem',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '1rem',
                marginBottom: '2rem',
                display: 'flex',
                alignItems: 'start',
                gap: '1rem'
              }}>
                <CheckIcon size={24} style={{ color: 'var(--color-success)', flexShrink: 0, marginTop: '0.25rem' }} />
                <div>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-success)' }}>Account Verified!</h4>
                  <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
                    Your account has been verified. You can now apply for loans.
                  </p>
                </div>
              </div>
            )}

            {user.status === 'rejected' && (
              <div style={{
                padding: '1.5rem',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '1rem',
                marginBottom: '2rem',
                display: 'flex',
                alignItems: 'start',
                gap: '1rem'
              }}>
                <XIcon size={24} style={{ color: 'var(--color-danger)', flexShrink: 0, marginTop: '0.25rem' }} />
                <div>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-danger)' }}>Verification Rejected</h4>
                  <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
                    Unfortunately, your verification was rejected. Please contact support for more information.
                  </p>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-header">
                  <div>
                    <div className="stat-value">{loans.length}</div>
                    <div className="stat-label">Total Applications</div>
                  </div>
                  <div className="stat-icon">
                    <FileIcon size={24} />
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <div>
                    <div className="stat-value">{loans.filter(l => l.status === 'pending').length}</div>
                    <div className="stat-label">Pending</div>
                  </div>
                  <div className="stat-icon">
                    <AlertIcon size={24} />
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <div>
                    <div className="stat-value">{loans.filter(l => l.status === 'approved').length}</div>
                    <div className="stat-label">Approved</div>
                  </div>
                  <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)' }}>
                    <CheckIcon size={24} />
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
                  <button className="btn btn-primary" onClick={() => setActiveSection('upload')}>
                    <UploadIcon size={20} />
                    Upload Documents
                  </button>
                  {user.status === 'verified' && (
                    <button className="btn btn-success" onClick={() => setActiveSection('apply')}>
                      <DollarIcon size={20} />
                      Apply for Loan
                    </button>
                  )}
                  <button className="btn btn-secondary" onClick={() => setActiveSection('loans')}>
                    <FileIcon size={20} />
                    View Applications
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upload Documents Section */}
        {activeSection === 'upload' && (
          <div className="fade-in">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Upload Identity Documents</h3>
              </div>
              <div className="card-body">
                <form onSubmit={handleUpload}>
                  <div className="form-group">
                    <label>Document Type</label>
                    <select value={docType} onChange={e => setDocType(e.target.value)}>
                      <option value="CNIC">CNIC / National ID</option>
                      <option value="Passport">Passport</option>
                      <option value="Driving License">Driving License</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Document Number</label>
                    <input
                      value={docNumber}
                      onChange={e => setDocNumber(e.target.value)}
                      placeholder="Enter document number"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Expiry Date</label>
                    <input
                      type="date"
                      value={expiry}
                      onChange={e => setExpiry(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Document Image</label>
                    <input
                      type="file"
                      onChange={e => setFile(e.target.files[0])}
                      accept="image/*"
                      required
                    />
                    <small style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginTop: '0.5rem', display: 'block' }}>
                      Accepted formats: JPG, PNG. Max size: 5MB
                    </small>
                  </div>

                  <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                    <UploadIcon size={20} />
                    Upload Document
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Apply for Loan Section */}
        {activeSection === 'apply' && user.status === 'verified' && (
          <div className="fade-in">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Loan Application</h3>
              </div>
              <div className="card-body">
                <form onSubmit={applyLoan}>
                  <div className="form-group">
                    <label>Loan Amount ($)</label>
                    <input
                      type="number"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      placeholder="e.g., 50000"
                      min="1000"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Loan Term (Months)</label>
                    <select value={term} onChange={e => setTerm(e.target.value)} required>
                      <option value="">Select term</option>
                      <option value="12">12 months</option>
                      <option value="24">24 months</option>
                      <option value="36">36 months</option>
                      <option value="48">48 months</option>
                      <option value="60">60 months</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Purpose</label>
                    <input
                      value={purpose}
                      onChange={e => setPurpose(e.target.value)}
                      placeholder="e.g., Home renovation, Business expansion"
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn-success btn-lg" style={{ width: '100%' }}>
                    <DollarIcon size={20} />
                    Submit Application
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* My Loans Section */}
        {activeSection === 'loans' && (
          <div className="fade-in">
            {loans.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                <FileIcon size={64} style={{ margin: '0 auto 1rem', color: 'var(--color-text-muted)' }} />
                <h3>No Applications Yet</h3>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
                  {user.status === 'verified'
                    ? 'You haven\'t applied for any loans yet'
                    : 'Complete verification to apply for loans'}
                </p>
                {user.status === 'verified' && (
                  <button className="btn btn-primary" onClick={() => setActiveSection('apply')}>
                    <DollarIcon size={20} />
                    Apply for Your First Loan
                  </button>
                )}
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Loan ID</th>
                      <th>Amount</th>
                      <th>Term</th>
                      <th>Purpose</th>
                      <th>Status</th>
                      <th>Applied Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loans.map(loan => (
                      <tr key={loan.loan_id}>
                        <td><strong>#{loan.loan_id}</strong></td>
                        <td><strong style={{ color: 'var(--color-success)' }}>${loan.amount.toLocaleString()}</strong></td>
                        <td>{loan.term} months</td>
                        <td>{loan.purpose}</td>
                        <td>{getStatusBadge(loan.status)}</td>
                        <td>{new Date(loan.applied_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CustomerDashboard;
