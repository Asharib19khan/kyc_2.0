import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HomeIcon, FileIcon, DollarIcon, LogoutIcon,
  UploadIcon, CheckIcon, XIcon, AlertIcon,
  CalendarIcon, ShieldIcon, MenuIcon, SunIcon, MoonIcon
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
  const [theme, setTheme] = useState('dark');

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (!user.role || user.role !== 'customer') navigate('/login');
    fetchLoans();
    // Load theme
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // Theme-aware colors
  const colors = theme === 'dark' ? {
    bgPrimary: '#0f0f1e',
    bgSecondary: 'rgba(22, 22, 42, 0.98)',
    bgCard: 'rgba(30, 30, 56, 0.7)',
    bgInput: 'rgba(15, 15, 30, 0.6)',
    textPrimary: '#f1f5f9',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    border: 'rgba(255,255,255,0.08)',
    borderHover: 'rgba(255,255,255,0.15)'
  } : {
    bgPrimary: '#f0f4f8',
    bgSecondary: '#ffffff',
    bgCard: 'rgba(255, 255, 255, 0.95)',
    bgInput: '#f8fafc',
    textPrimary: '#1e293b',
    textSecondary: '#475569',
    textMuted: '#64748b',
    border: 'rgba(0,0,0,0.1)',
    borderHover: 'rgba(0,0,0,0.2)'
  };

  const fetchLoans = async () => {
    try {
      const res = await fetch(`http://localhost:5000/customer/loans?user_id=${user.id}`, {
        headers: { 'Authorization': localStorage.getItem('token') }
      });
      const data = await res.json();
      if (data.success) setLoans(data.data);
    } catch (error) {
      console.error('Error fetching loans:', error);
    }
  };

  const applyLoan = async (e) => {
    e.preventDefault();
    if (user.status !== 'verified') {
      alert('You must be verified to apply for a loan.');
      return;
    }

    try {
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
        alert('Loan application submitted successfully!');
        fetchLoans();
        setAmount('');
        setTerm('');
        setPurpose('');
        setActiveSection('loans');
      } else {
        alert('Failed to submit application.');
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    try {
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
        alert('Document uploaded successfully!');
        setFile(null);
        setDocNumber('');
        setExpiry('');
        document.querySelector('input[type="file"]').value = '';
      } else {
        alert(`Upload failed: ${data.message || 'Please try again.'}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Upload failed: ${error.message || 'Network error. Check if the server is running.'}`);
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: { background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600' },
      verified: { background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600' },
      rejected: { background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600' },
      approved: { background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600' }
    };
    return <span style={styles[status] || styles.pending}>{status?.charAt(0).toUpperCase() + status?.slice(1)}</span>;
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: theme === 'dark' 
        ? 'linear-gradient(135deg, #0f0f1e 0%, #16162a 100%)'
        : 'linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%)'
    }}>
      <div style={{
        width: sidebarOpen ? '280px' : '0',
        minWidth: sidebarOpen ? '280px' : '0',
        background: theme === 'dark' ? 'rgba(22, 22, 42, 0.98)' : 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(20px)',
        borderRight: `1px solid ${colors.border}`,
        padding: sidebarOpen ? '1.5rem' : '0',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        height: '100vh',
        left: 0,
        top: 0,
        zIndex: 100,
        overflowY: 'auto',
        overflowX: 'hidden',
        transition: 'all 0.3s ease'
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{
            width: '40px', height: '40px',
            background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
            borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <ShieldIcon size={24} color="white" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.125rem', color: colors.textPrimary }}>KYC Portal</h3>
            <p style={{ margin: 0, fontSize: '0.75rem', color: colors.textSecondary }}>Customer</p>
          </div>
        </div>

        {/* User Info */}
        <div style={{
          padding: '1rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '0.75rem',
          marginBottom: '1.5rem', border: '1px solid rgba(99, 102, 241, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: '1.25rem', fontWeight: 'bold'
            }}>
              {user.name?.charAt(0) || 'U'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: '600', fontSize: '0.875rem', color: colors.textPrimary }}>{user.name}</div>
              <div style={{ marginTop: '0.25rem' }}>{getStatusBadge(user.status)}</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1 }}>
          {[
            { id: 'overview', icon: HomeIcon, label: 'Overview' },
            { id: 'upload', icon: UploadIcon, label: 'Upload Documents' },
            ...(user.status === 'verified' ? [{ id: 'apply', icon: DollarIcon, label: 'Apply for Loan' }] : []),
            { id: 'loans', icon: FileIcon, label: 'My Applications', badge: loans.length }
          ].map(item => (
            <a key={item.id} onClick={() => setActiveSection(item.id)} style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1rem',
              marginBottom: '0.5rem', color: activeSection === item.id ? 'white' : '#cbd5e1',
              textDecoration: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '500',
              background: activeSection === item.id ? 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)' : 'transparent',
              boxShadow: activeSection === item.id ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none',
              transition: 'all 0.2s ease'
            }}>
              <item.icon size={20} />
              {item.label}
              {item.badge > 0 && (
                <span style={{ marginLeft: 'auto', background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6',
                  padding: '0.125rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600' }}>
                  {item.badge}
                </span>
              )}
            </a>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ paddingTop: '1rem', borderTop: `1px solid ${colors.border}` }}>
          <a onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
            color: '#ef4444', cursor: 'pointer', borderRadius: '0.5rem' }}>
            <LogoutIcon size={20} /> Logout
          </a>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, marginLeft: sidebarOpen ? '280px' : '0', padding: '2rem', transition: 'margin-left 0.3s ease' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: '800', color: colors.textPrimary, margin: 0 }}>
              {activeSection === 'overview' && 'Dashboard'}
              {activeSection === 'upload' && 'Upload Documents'}
              {activeSection === 'apply' && 'Apply for Loan'}
              {activeSection === 'loans' && 'My Applications'}
            </h1>
            <p style={{ color: colors.textSecondary, margin: '0.5rem 0 0 0' }}>Welcome, {user.name}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button onClick={toggleTheme} style={{
              padding: '0.5rem', background: colors.bgCard, border: `1px solid ${colors.border}`,
              borderRadius: '0.5rem', cursor: 'pointer', color: colors.textSecondary
            }}>
              {theme === 'dark' ? <SunIcon size={20} /> : <MoonIcon size={20} />}
            </button>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{
              padding: '0.5rem', background: colors.bgCard, border: `1px solid ${colors.border}`,
              borderRadius: '0.5rem', cursor: 'pointer', color: colors.textSecondary
            }}>
              <MenuIcon size={20} />
            </button>
          </div>
        </div>

        {/* Overview Section */}
        {activeSection === 'overview' && (
          <div>
            {/* Status Alerts */}
            {user.status === 'pending' && (
              <div style={{ padding: '1.5rem', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)',
                borderRadius: '1rem', marginBottom: '2rem', display: 'flex', alignItems: 'start', gap: '1rem' }}>
                <AlertIcon size={24} style={{ color: '#f59e0b', flexShrink: 0 }} />
                <div>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#f59e0b' }}>Verification Pending</h4>
                  <p style={{ margin: 0, color: '#cbd5e1' }}>Your account is under review. Please upload your documents to complete verification.</p>
                  <button onClick={() => setActiveSection('upload')} style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.5rem 1rem', background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b',
                    border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '500' }}>
                    <UploadIcon size={16} /> Upload Documents Now
                  </button>
                </div>
              </div>
            )}

            {user.status === 'verified' && (
              <div style={{ padding: '1.5rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '1rem', marginBottom: '2rem', display: 'flex', alignItems: 'start', gap: '1rem' }}>
                <CheckIcon size={24} style={{ color: '#10b981', flexShrink: 0 }} />
                <div>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#10b981' }}>Account Verified!</h4>
                  <p style={{ margin: 0, color: '#cbd5e1' }}>Your account has been verified. You can now apply for loans.</p>
                </div>
              </div>
            )}

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              {[
                { value: loans.length, label: 'Total Applications', icon: FileIcon, color: '#6366f1' },
                { value: loans.filter(l => l.status === 'pending').length, label: 'Pending', icon: AlertIcon, color: '#f59e0b' },
                { value: loans.filter(l => l.status === 'approved').length, label: 'Approved', icon: CheckIcon, color: '#10b981' }
              ].map((stat, idx) => (
                <div key={idx} style={{ background: 'rgba(30, 30, 56, 0.7)', backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.08)', borderRadius: '1rem', padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: `linear-gradient(90deg, ${stat.color} 0%, ${stat.color}88 100%)` }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '2rem', fontWeight: '800', color: '#f1f5f9' }}>{stat.value}</div>
                      <div style={{ color: '#94a3b8', fontSize: '0.875rem', textTransform: 'uppercase' }}>{stat.label}</div>
                    </div>
                    <div style={{ width: '48px', height: '48px', borderRadius: '0.75rem', background: `${stat.color}20`, color: stat.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <stat.icon size={24} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Verification & Account Info Section */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              
              {/* Verification Progress */}
              <div style={{ 
                background: 'rgba(30, 30, 56, 0.7)', 
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.08)', 
                borderRadius: '1rem', 
                padding: '1.5rem',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Top accent bar */}
                <div style={{ 
                  position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
                  background: user.status === 'verified' ? '#10b981' : user.status === 'pending' ? '#f59e0b' : '#ef4444'
                }} />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ color: '#f1f5f9', margin: 0, fontSize: '1rem', fontWeight: '600' }}>Verification Status</h3>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    color: user.status === 'verified' ? '#10b981' : user.status === 'pending' ? '#f59e0b' : '#ef4444',
                    background: user.status === 'verified' ? 'rgba(16,185,129,0.15)' : user.status === 'pending' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                    padding: '0.375rem 0.75rem', borderRadius: '0.375rem', fontWeight: '600', textTransform: 'uppercase'
                  }}>{user.status === 'verified' ? 'Verified' : user.status === 'pending' ? 'Pending' : 'Rejected'}</span>
                </div>
                
                {/* Progress Steps - Vertical Timeline */}
                <div style={{ position: 'relative', paddingLeft: '1.5rem' }}>
                  {/* Vertical line */}
                  <div style={{ 
                    position: 'absolute', left: '8px', top: '8px', bottom: '8px', width: '2px',
                    background: 'rgba(100,116,139,0.3)'
                  }} />
                  
                  {[
                    { label: 'Account Created', detail: 'Registration complete', done: true },
                    { label: 'Upload Documents', detail: 'Submit CNIC/ID for verification', done: user.status !== 'pending' },
                    { label: 'Under Review', detail: 'Admin reviewing your documents', done: user.status === 'verified' },
                    { label: 'Verified', detail: 'Full access granted', done: user.status === 'verified' }
                  ].map((step, idx) => (
                    <div key={idx} style={{ 
                      display: 'flex', alignItems: 'flex-start', gap: '1rem', 
                      marginBottom: idx < 3 ? '1.25rem' : 0,
                      position: 'relative'
                    }}>
                      {/* Step indicator */}
                      <div style={{ 
                        position: 'absolute', left: '-1.5rem',
                        width: '18px', height: '18px', borderRadius: '50%', 
                        background: step.done ? '#10b981' : 'rgba(30, 30, 56, 1)',
                        border: step.done ? 'none' : '2px solid rgba(100,116,139,0.5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 1
                      }}>
                        {step.done && <CheckIcon size={10} style={{ color: 'white' }} />}
                      </div>
                      
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          color: step.done ? '#f1f5f9' : '#94a3b8', 
                          fontSize: '0.875rem', fontWeight: '500'
                        }}>{step.label}</div>
                        <div style={{ 
                          color: '#64748b', fontSize: '0.75rem', marginTop: '0.125rem'
                        }}>{step.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Account Information */}
              <div style={{ 
                background: 'rgba(30, 30, 56, 0.7)', 
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.08)', 
                borderRadius: '1rem', 
                padding: '1.5rem',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Top accent bar */}
                <div style={{ 
                  position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
                  background: 'linear-gradient(90deg, #6366f1, #8b5cf6)'
                }} />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ color: '#f1f5f9', margin: 0, fontSize: '1rem', fontWeight: '600' }}>Account Information</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <ShieldIcon size={14} style={{ color: '#10b981' }} />
                    <span style={{ fontSize: '0.6875rem', color: '#10b981', fontWeight: '600' }}>SECURE</span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  {/* Account ID */}
                  <div style={{ 
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.75rem 1rem', 
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(139,92,246,0.1) 100%)', 
                    borderRadius: '0.5rem',
                    border: '1px solid rgba(99,102,241,0.2)'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.6875rem', color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Customer ID</div>
                      <div style={{ fontSize: '1.125rem', color: '#f1f5f9', fontWeight: '700', marginTop: '0.125rem', fontFamily: 'monospace' }}>
                        CUS-{String(user.id ? user.id - 1 : 1).padStart(4, '0')}
                      </div>
                    </div>
                    <div style={{ 
                      padding: '0.375rem 0.625rem', 
                      background: 'rgba(99,102,241,0.2)', 
                      borderRadius: '0.375rem',
                      fontSize: '0.6875rem', color: '#a5b4fc', fontWeight: '600'
                    }}>PRIMARY</div>
                  </div>
                  
                  {/* Other details */}
                  {[
                    { label: 'Full Name', value: user.name || 'Not provided' },
                    { label: 'Account Type', value: 'Individual Customer' },
                    { label: 'Loan Eligibility', value: user.status === 'verified' ? 'Eligible' : 'Complete KYC first' }
                  ].map((item, idx) => (
                    <div key={idx} style={{ 
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '0.625rem 0', 
                      borderBottom: idx < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none'
                    }}>
                      <span style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>{item.label}</span>
                      <span style={{ fontSize: '0.875rem', color: '#f1f5f9', fontWeight: '500' }}>{item.value}</span>
                    </div>
                  ))}
                </div>
                
                {/* Encryption notice */}
                <div style={{ 
                  marginTop: '1rem', padding: '0.625rem 0.75rem', 
                  background: 'rgba(16,185,129,0.08)', 
                  borderRadius: '0.5rem', 
                  border: '1px solid rgba(16,185,129,0.15)',
                  display: 'flex', alignItems: 'center', gap: '0.5rem' 
                }}>
                  <ShieldIcon size={14} style={{ color: '#10b981', flexShrink: 0 }} />
                  <span style={{ color: '#6ee7b7', fontSize: '0.6875rem' }}>
                    Encrypted with AES-256 encryption
                  </span>
                </div>
              </div>
            </div>

            {/* Verification Queue - Only for pending users */}
            {user.status === 'pending' && (
              <div style={{ 
                background: 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(251,191,36,0.08) 100%)',
                backdropFilter: 'blur(20px)', 
                border: '1px solid rgba(245,158,11,0.2)', 
                borderRadius: '1rem', 
                padding: '1.25rem 1.5rem',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ 
                    width: '48px', height: '48px', borderRadius: '0.75rem', 
                    background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <AlertIcon size={24} style={{ color: 'white' }} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, color: '#f1f5f9', fontSize: '1rem', fontWeight: '600' }}>Action Required</h4>
                    <p style={{ margin: '0.25rem 0 0 0', color: '#fcd34d', fontSize: '0.8125rem' }}>
                      Upload your documents to complete verification
                    </p>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.6875rem', color: '#fcd34d', marginBottom: '0.125rem' }}>
                      You are customer
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#f1f5f9' }}>
                      #{user.id ? user.id - 1 : 1}
                    </div>
                  </div>
                  <button onClick={() => setActiveSection('upload')} style={{ 
                    display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
                    color: '#1e1e38', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '700',
                    fontSize: '0.875rem', boxShadow: '0 4px 12px rgba(245,158,11,0.35)'
                  }}>
                    <UploadIcon size={16} /> Upload Now
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Upload Documents Section */}
        {activeSection === 'upload' && (
          <div>
            <div style={{ background: 'rgba(30, 30, 56, 0.7)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: '1rem', padding: '2rem' }}>
              <h3 style={{ color: '#f1f5f9', marginBottom: '1.5rem' }}>Upload Identity Documents</h3>
              <form onSubmit={handleUpload}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', color: '#94a3b8', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Document Type</label>
                  <select value={docType} onChange={e => setDocType(e.target.value)} style={{
                    width: '100%', padding: '0.875rem 1rem', background: 'rgba(15, 15, 30, 0.6)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', color: '#f1f5f9', fontSize: '1rem'
                  }}>
                    <option value="CNIC">CNIC / National ID</option>
                    <option value="Passport">Passport</option>
                    <option value="Driving License">Driving License</option>
                  </select>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', color: '#94a3b8', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                    {docType === 'CNIC' ? 'CNIC Number' : docType === 'Passport' ? 'Passport Number' : 'License Number'}
                  </label>
                  <input value={docNumber} onChange={e => setDocNumber(e.target.value)}
                    placeholder={docType === 'CNIC' ? 'e.g., 12345-6789012-3' : docType === 'Passport' ? 'e.g., AB1234567' : 'e.g., DL-12345'}
                    required style={{ width: '100%', padding: '0.875rem 1rem', background: 'rgba(15, 15, 30, 0.6)',
                      border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', color: '#f1f5f9', fontSize: '1rem' }} />
                  <small style={{ color: '#64748b', fontSize: '0.75rem', display: 'block', marginTop: '0.25rem' }}>
                    Enter your official {docType === 'CNIC' ? 'CNIC' : docType} number
                  </small>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', color: '#94a3b8', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Expiry Date</label>
                  <input type="date" value={expiry} onChange={e => setExpiry(e.target.value)} required style={{
                    width: '100%', padding: '0.875rem 1rem', background: 'rgba(15, 15, 30, 0.6)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', color: '#f1f5f9', fontSize: '1rem'
                  }} />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', color: '#94a3b8', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Document Image</label>
                  <input type="file" onChange={e => setFile(e.target.files[0])} accept="image/*" required style={{
                    width: '100%', padding: '0.875rem 1rem', background: 'rgba(15, 15, 30, 0.6)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', color: '#f1f5f9', fontSize: '1rem'
                  }} />
                  <small style={{ color: '#64748b', fontSize: '0.75rem', display: 'block', marginTop: '0.25rem' }}>
                    Accepted formats: JPG, PNG. Max size: 5MB
                  </small>
                </div>

                <button type="submit" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  padding: '1rem 1.5rem', background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
                  color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '600', fontSize: '1rem' }}>
                  <UploadIcon size={20} /> Upload Document
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Apply for Loan Section */}
        {activeSection === 'apply' && user.status === 'verified' && (
          <div>
            <div style={{ background: 'rgba(30, 30, 56, 0.7)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: '1rem', padding: '2rem' }}>
              <h3 style={{ color: '#f1f5f9', marginBottom: '1.5rem' }}>Loan Application</h3>
              <form onSubmit={applyLoan}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', color: '#94a3b8', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Loan Amount ($)</label>
                  <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g., 50000" min="1000" required style={{
                    width: '100%', padding: '0.875rem 1rem', background: 'rgba(15, 15, 30, 0.6)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', color: '#f1f5f9', fontSize: '1rem'
                  }} />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', color: '#94a3b8', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Loan Term (Months)</label>
                  <select value={term} onChange={e => setTerm(e.target.value)} required style={{
                    width: '100%', padding: '0.875rem 1rem', background: 'rgba(15, 15, 30, 0.6)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', color: '#f1f5f9', fontSize: '1rem'
                  }}>
                    <option value="">Select term</option>
                    <option value="12">12 months</option>
                    <option value="24">24 months</option>
                    <option value="36">36 months</option>
                    <option value="48">48 months</option>
                    <option value="60">60 months</option>
                  </select>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', color: '#94a3b8', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Purpose</label>
                  <input value={purpose} onChange={e => setPurpose(e.target.value)} placeholder="e.g., Home renovation, Business expansion" required style={{
                    width: '100%', padding: '0.875rem 1rem', background: 'rgba(15, 15, 30, 0.6)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', color: '#f1f5f9', fontSize: '1rem'
                  }} />
                </div>

                <button type="submit" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  padding: '1rem 1.5rem', background: '#10b981',
                  color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '600', fontSize: '1rem' }}>
                  <DollarIcon size={20} /> Submit Application
                </button>
              </form>
            </div>
          </div>
        )}

        {/* My Applications Section */}
        {activeSection === 'loans' && (
          <div>
            {loans.length === 0 ? (
              <div style={{ background: 'rgba(30, 30, 56, 0.7)', backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: '1rem', padding: '3rem', textAlign: 'center' }}>
                <FileIcon size={64} style={{ margin: '0 auto 1rem', color: '#64748b' }} />
                <h3 style={{ color: '#f1f5f9', marginBottom: '0.5rem' }}>No Applications Yet</h3>
                <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
                  {user.status === 'verified' ? "You haven't applied for any loans yet" : 'Complete verification to apply for loans'}
                </p>
                {user.status === 'verified' && (
                  <button onClick={() => setActiveSection('apply')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.875rem 1.5rem', background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
                    color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '600' }}>
                    <DollarIcon size={20} /> Apply for Your First Loan
                  </button>
                )}
              </div>
            ) : (
              <div style={{ background: 'rgba(30, 30, 56, 0.7)', backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: '1rem', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <th style={{ padding: '1rem', textAlign: 'left', color: '#94a3b8', fontWeight: '600', fontSize: '0.875rem' }}>Loan ID</th>
                      <th style={{ padding: '1rem', textAlign: 'left', color: '#94a3b8', fontWeight: '600', fontSize: '0.875rem' }}>Amount</th>
                      <th style={{ padding: '1rem', textAlign: 'left', color: '#94a3b8', fontWeight: '600', fontSize: '0.875rem' }}>Term</th>
                      <th style={{ padding: '1rem', textAlign: 'left', color: '#94a3b8', fontWeight: '600', fontSize: '0.875rem' }}>Purpose</th>
                      <th style={{ padding: '1rem', textAlign: 'left', color: '#94a3b8', fontWeight: '600', fontSize: '0.875rem' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loans.map(loan => (
                      <tr key={loan.loan_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '1rem', color: '#f1f5f9' }}><strong>#{loan.loan_id}</strong></td>
                        <td style={{ padding: '1rem', color: '#10b981', fontWeight: '600' }}>${loan.amount?.toLocaleString()}</td>
                        <td style={{ padding: '1rem', color: '#cbd5e1' }}>{loan.term} months</td>
                        <td style={{ padding: '1rem', color: '#cbd5e1' }}>{loan.purpose}</td>
                        <td style={{ padding: '1rem' }}>{getStatusBadge(loan.status)}</td>
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
