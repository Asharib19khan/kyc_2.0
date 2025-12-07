import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HomeIcon, UsersIcon, FileIcon, DollarIcon, ChartIcon,
  SettingsIcon, LogoutIcon, CheckIcon, XIcon, DownloadIcon,
  ShieldIcon, AlertIcon, MenuIcon, SunIcon, MoonIcon
} from './Icons';
import { toast } from 'react-hot-toast';
import { useTheme } from '../hooks/useTheme';
import { getThemeColors } from '../utils/themeColors';

function AdminDashboard() {
  const [activeSection, setActiveSection] = useState('overview');
  const [verifications, setVerifications] = useState([]);
  const [loanRequests, setLoanRequests] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [stats, setStats] = useState({ users: 0, pending: 0, verified: 0, loans: 0 });
  const [newAdmin, setNewAdmin] = useState({ first: '', last: '', email: '', password: '' });
  const [showModal, setShowModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showHistory, setShowHistory] = useState(false); // New state for history toggle
  
  // New State for Note Modal
  const [noteModal, setNoteModal] = useState({ show: false, loanId: null, action: null });
  const [noteText, setNoteText] = useState('');

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isSuper = user.role === 'super_admin';
  const { theme, toggleTheme } = useTheme();
  const colors = getThemeColors(theme);

  useEffect(() => {
    if (user.role !== 'admin' && user.role !== 'super_admin') navigate('/login');
    fetchData();
  }, []);

  // Refetch when showHistory toggles
  useEffect(() => {
    fetchData();
  }, [showHistory]);

  const fetchData = () => {
    const headers = { 'Authorization': localStorage.getItem('token') };

    fetch(`http://localhost:5000/admin/verification-requests?show_history=${showHistory}`, { headers })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setVerifications(data.data);
          setStats(prev => ({
            ...prev,
            pending: data.data.filter(v => v.status === 'pending').length,
            users: data.data.length 
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
    toast.success('Admin created successfully!');
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
    toast.success('Admin deleted successfully!');
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
    toast.success(`User ${action}d successfully!`);
  };

  // Replaces the old direct prompt
  const openNoteModal = (loan_id, action) => {
    setNoteModal({ show: true, loanId: loan_id, action });
    setNoteText('');
  };

  const submitLoanDecision = async (e) => {
    e.preventDefault();
    const { loanId, action } = noteModal;
    
    // Close modal immediately
    setNoteModal({ show: false, loanId: null, action: null });

    const res = await fetch('http://localhost:5000/admin/loan-decision', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': localStorage.getItem('token')
      },
      body: JSON.stringify({ loan_id: loanId, decision: action, notes: noteText })
    });
    const data = await res.json();
    
    if (data.success) {
      fetchData();
      toast.success(`Loan ${action}d!`);
    }
  };

  const exportExcel = async () => {
    const res = await fetch('http://localhost:5000/export/excel', {
      headers: { 'Authorization': localStorage.getItem('token') }
    });
    const data = await res.json();
    if (data.success) {
      window.open('http://localhost:5000' + data.download_url, '_blank');
      toast.success('Excel report downloaded!');
    }
  };

  const exportCSV = async (type) => {
    const res = await fetch(`http://localhost:5000/export/csv?type=${type}`, {
      headers: { 'Authorization': localStorage.getItem('token') }
    });
    const data = await res.json();
    if (data.success) {
      window.open('http://localhost:5000' + data.download_url, '_blank');
      toast.success(`${type === 'customers' ? 'Customer' : 'Loan'} data exported to CSV!`);
    } else {
      toast.error('Failed to export CSV');
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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: theme === 'dark' 
        ? 'linear-gradient(135deg, #0f0f1e 0%, #16162a 100%)'
        : 'linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%)'
    }}>
      {/* Sidebar */}
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
            width: '40px',
            height: '40px',
            background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
            borderRadius: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShieldIcon size={24} color="white" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.125rem', color: colors.textPrimary }}>KYC Portal</h3>
            <p style={{ margin: 0, fontSize: '0.75rem', color: colors.textSecondary }}>
              {isSuper ? 'Super Admin' : 'Admin'}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1 }}>
          {[
            { id: 'overview', icon: HomeIcon, label: 'Overview' },
            { id: 'verifications', icon: FileIcon, label: 'Verifications', badge: verifications.length },
            { id: 'loans', icon: DollarIcon, label: 'Loan Requests', badge: loanRequests.length },
            ...(isSuper ? [{ id: 'admins', icon: UsersIcon, label: 'Admin Management' }] : []),
            { id: 'analytics', icon: ChartIcon, label: 'Analytics' }
          ].map(item => (
            <a
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.875rem 1rem',
                marginBottom: '0.5rem',
                color: activeSection === item.id ? 'white' : '#cbd5e1',
                textDecoration: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontWeight: '500',
                background: activeSection === item.id 
                  ? 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)'
                  : 'transparent',
                boxShadow: activeSection === item.id 
                  ? '0 4px 12px rgba(99, 102, 241, 0.3)'
                  : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <item.icon size={20} />
              {item.label}
              {item.badge > 0 && (
                <span style={{
                  marginLeft: 'auto',
                  background: 'rgba(245, 158, 11, 0.2)',
                  color: '#f59e0b',
                  padding: '0.125rem 0.5rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: '600'
                }}>
                  {item.badge}
                </span>
              )}
            </a>
          ))}
        </nav>

        {/* Footer Actions */}
        <div style={{ paddingTop: '1rem', borderTop: `1px solid ${colors.border}` }}>
          <a onClick={exportExcel} style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
            color: colors.textSecondary, cursor: 'pointer', borderRadius: '0.5rem', marginBottom: '0.5rem'
          }}>
            <DownloadIcon size={20} />
            Export Excel
          </a>
          <a onClick={logout} style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
            color: '#ef4444', cursor: 'pointer', borderRadius: '0.5rem'
          }}>
            <LogoutIcon size={20} />
            Logout
          </a>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        marginLeft: sidebarOpen ? '280px' : '0',
        padding: '2rem',
        transition: 'margin-left 0.3s ease'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          paddingBottom: '1.5rem',
          borderBottom: `1px solid ${colors.border}`
        }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: '800', color: colors.textPrimary, margin: 0 }}>
              {activeSection === 'overview' && 'Dashboard Overview'}
              {activeSection === 'verifications' && 'KYC Verifications'}
              {activeSection === 'loans' && 'Loan Requests'}
              {activeSection === 'admins' && 'Admin Management'}
              {activeSection === 'analytics' && 'Analytics & Reports'}
            </h1>
            <p style={{ color: colors.textSecondary, margin: '0.5rem 0 0 0' }}>Welcome back, {user.name}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button 
              onClick={toggleTheme}
              style={{
                padding: '0.5rem',
                background: colors.bgCard,
                border: `1px solid ${colors.border}`,
                borderRadius: '0.5rem',
                cursor: 'pointer',
                color: colors.textSecondary
              }}
            >
              {theme === 'dark' ? <SunIcon size={20} /> : <MoonIcon size={20} />}
            </button>
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                padding: '0.5rem',
                background: colors.bgCard,
                border: `1px solid ${colors.border}`,
                borderRadius: '0.5rem',
                cursor: 'pointer',
                color: colors.textSecondary
              }}
            >
              <MenuIcon size={20} />
            </button>
          </div>
        </div>

        {/* Overview Section */}
        {activeSection === 'overview' && (
          <div>
            {/* Stats Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem'
            }}>
              {[
                { value: verifications.length, label: 'Pending KYC', icon: FileIcon, color: '#6366f1' },
                { value: loanRequests.length, label: 'Pending Loans', icon: DollarIcon, color: '#10b981' },
                ...(isSuper ? [{ value: admins.length, label: 'Total Admins', icon: UsersIcon, color: '#f59e0b' }] : []),
                { value: verifications.length + loanRequests.length, label: 'Total Pending', icon: AlertIcon, color: '#ef4444' }
              ].map((stat, idx) => (
                <div key={idx} style={{
                  background: 'rgba(30, 30, 56, 0.7)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '1rem',
                  padding: '1.5rem',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
                    background: `linear-gradient(90deg, ${stat.color} 0%, ${stat.color}88 100%)`
                  }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '2rem', fontWeight: '800', color: colors.textPrimary }}>{stat.value}</div>
                      <div style={{ color: colors.textSecondary, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {stat.label}
                      </div>
                    </div>
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '0.75rem',
                      background: `${stat.color}20`, color: stat.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <stat.icon size={24} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts Section */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              
              {/* KYC Status Donut Chart */}
              <div style={{
                background: colors.bgCard,
                backdropFilter: 'blur(20px)',
                border: `1px solid ${colors.border}`,
                borderRadius: '1rem',
                padding: '1.5rem',
                boxShadow: theme === 'light' ? '0 4px 20px rgba(0,0,0,0.08)' : 'none'
              }}>
                <h3 style={{ color: colors.textPrimary, marginBottom: '1.5rem', fontSize: '1rem', fontWeight: '600' }}>KYC Status Distribution</h3>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem' }}>
                  {/* Simple CSS Donut Chart */}
                  <div style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    background: verifications.length === 0 
                      ? 'rgba(100, 116, 139, 0.3)'
                      : `conic-gradient(#f59e0b 0deg 360deg)`,
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <div style={{
                      width: '70px',
                      height: '70px',
                      borderRadius: '50%',
                      background: theme === 'dark' ? 'rgba(30, 30, 56, 1)' : '#f8fafc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column'
                    }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: '700', color: colors.textPrimary }}>
                        {verifications.length}
                      </div>
                      <div style={{ fontSize: '0.625rem', color: colors.textSecondary }}>PENDING</div>
                    </div>
                  </div>
                  {/* Legend */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {[
                      { label: 'Approved', color: '#10b981', value: 0 },
                      { label: 'Pending', color: '#f59e0b', value: verifications.length },
                      { label: 'Rejected', color: '#ef4444', value: 0 }
                    ].map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color }} />
                        <span style={{ color: '#94a3b8', fontSize: '0.8125rem' }}>{item.label}</span>
                        <span style={{ color: '#f1f5f9', fontWeight: '600', fontSize: '0.8125rem', marginLeft: 'auto' }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Loans Bar Chart */}
              <div style={{
                background: colors.bgCard,
                backdropFilter: 'blur(20px)',
                border: `1px solid ${colors.border}`,
                borderRadius: '1rem',
                padding: '1.5rem',
                boxShadow: theme === 'light' ? '0 4px 20px rgba(0,0,0,0.08)' : 'none'
              }}>
                <h3 style={{ color: colors.textPrimary, marginBottom: '1.5rem', fontSize: '1rem', fontWeight: '600' }}>Loan Requests (Last 6 Months)</h3>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '100px', gap: '0.5rem' }}>
                  {[
                    { month: 'Jul', value: 0 },
                    { month: 'Aug', value: 0 },
                    { month: 'Sep', value: 0 },
                    { month: 'Oct', value: 0 },
                    { month: 'Nov', value: 0 },
                    { month: 'Dec', value: loanRequests.length }
                  ].map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                      <div style={{
                        width: '100%',
                        height: item.value > 0 ? `${Math.min(item.value * 10, 100)}%` : '4px',
                        background: item.value > 0 
                          ? 'linear-gradient(180deg, #6366f1 0%, #4f46e5 100%)'
                          : 'rgba(100, 116, 139, 0.3)',
                        borderRadius: '0.25rem 0.25rem 0 0',
                        minHeight: '4px',
                        transition: 'height 0.3s ease'
                      }} />
                      <span style={{ color: colors.textSecondary, fontSize: '0.6875rem', marginTop: '0.5rem' }}>{item.month}</span>
                    </div>
                  ))}
                </div>
                <div style={{ textAlign: 'center', marginTop: '1rem', color: colors.textMuted, fontSize: '0.75rem' }}>
                  Total: {loanRequests.length} pending request{loanRequests.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>

            {/* Recent Activity Feed */}
            <div style={{
              background: colors.bgCard,
              backdropFilter: 'blur(20px)',
              border: `1px solid ${colors.border}`,
              borderRadius: '1rem',
              padding: '1.5rem',
              boxShadow: theme === 'light' ? '0 4px 20px rgba(0,0,0,0.08)' : 'none'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ color: colors.textPrimary, fontSize: '1rem', fontWeight: '600', margin: 0 }}>Recent Activity</h3>
              </div>
              {(verifications.length === 0 && loanRequests.length === 0) ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '2rem',
                  color: colors.textMuted
                }}>
                  <AlertIcon size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                  <p style={{ margin: 0, fontSize: '0.875rem' }}>No recent activity yet</p>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: '#475569' }}>
                    Activity will appear here when customers submit KYC documents or loan requests
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {verifications.map((v, idx) => (
                    <div key={`kyc-${idx}`} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '0.875rem',
                      background: colors.bgInput,
                      borderRadius: '0.75rem',
                      border: `1px solid ${colors.border}`
                    }}>
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '0.5rem',
                        background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>
                        <FileIcon size={20} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: colors.textPrimary, fontSize: '0.875rem', fontWeight: '500' }}>KYC verification pending</div>
                        <div style={{ color: colors.textMuted, fontSize: '0.75rem' }}>{v.name || v.email}</div>
                      </div>
                      <div style={{ color: '#f59e0b', fontSize: '0.75rem', fontWeight: '500' }}>Pending</div>
                    </div>
                  ))}
                  {loanRequests.map((loan, idx) => (
                    <div key={`loan-${idx}`} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '0.875rem',
                      background: colors.bgInput,
                      borderRadius: '0.75rem',
                      border: `1px solid ${colors.border}`
                    }}>
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '0.5rem',
                        background: 'rgba(16, 185, 129, 0.15)', color: '#10b981',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>
                        <DollarIcon size={20} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: colors.textPrimary, fontSize: '0.875rem', fontWeight: '500' }}>Loan request - ${loan.amount?.toLocaleString()}</div>
                        <div style={{ color: colors.textMuted, fontSize: '0.75rem' }}>{loan.customer_name}</div>
                      </div>
                      <div style={{ color: '#f59e0b', fontSize: '0.75rem', fontWeight: '500' }}>Pending</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Verifications Section */}
        {activeSection === 'verifications' && (
          <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', margin: 0, color: colors.textPrimary }}>
                {showHistory ? 'Verification History' : 'Pending Verifications'}
              </h2>
              <button 
                onClick={() => setShowHistory(!showHistory)}
                style={{
                  padding: '0.5rem 1rem',
                  background: showHistory ? colors.bgCard : 'rgba(99, 102, 241, 0.1)',
                  color: showHistory ? colors.textSecondary : '#6366f1',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.875rem'
                }}
              >
                {showHistory ? 'Show Pending' : 'Show History'}
              </button>
            </div>

            {verifications.filter(v => showHistory ? v.status !== 'pending' : v.status === 'pending').length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '3rem', 
                background: colors.bgCard,
                borderRadius: '1rem',
                border: `1px solid ${colors.border}`,
                boxShadow: theme === 'light' ? '0 4px 20px rgba(0,0,0,0.08)' : 'none'
              }}>
                <FileIcon size={64} style={{ margin: '0 auto 1rem', color: colors.textMuted }} />
                <h3 style={{ color: colors.textPrimary }}>
                  {showHistory ? 'No Verification History' : 'No Pending Verifications'}
                </h3>
                <p style={{ color: colors.textMuted }}>
                  {showHistory ? 'No past verifications found' : 'All users have been processed'}
                </p>
              </div>
            ) : (
              <div style={{ 
                background: colors.bgCard,
                borderRadius: '1rem',
                border: `1px solid ${colors.border}`,
                overflow: 'hidden',
                boxShadow: theme === 'light' ? '0 4px 20px rgba(0,0,0,0.08)' : 'none'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${colors.border}`, background: colors.bgSecondary }}>
                      <th style={{ padding: '1rem', textAlign: 'left', color: colors.textSecondary, fontWeight: '600', fontSize: '0.875rem' }}>Customer</th>
                      <th style={{ padding: '1rem', textAlign: 'left', color: colors.textSecondary, fontWeight: '600', fontSize: '0.875rem' }}>Documents</th>
                      <th style={{ padding: '1rem', textAlign: 'left', color: colors.textSecondary, fontWeight: '600', fontSize: '0.875rem' }}>Status</th>
                      <th style={{ padding: '1rem', textAlign: 'left', color: colors.textSecondary, fontWeight: '600', fontSize: '0.875rem' }}>
                        {showHistory ? 'Processed By' : 'Actions'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {verifications.filter(v => showHistory ? v.status !== 'pending' : v.status === 'pending').map(req => (
                      <tr key={req.user_id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ color: colors.textPrimary, fontWeight: '600' }}>{req.name}</div>
                          <div style={{ fontSize: '0.875rem', color: colors.textSecondary }}>{req.email}</div>
                          <div style={{ fontSize: '0.75rem', color: colors.textMuted }}>{req.phone}</div>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          {req.documents.length === 0 ? (
                            <span style={{ 
                              padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600',
                              background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b'
                            }}>No Docs</span>
                          ) : (
                            req.documents.map((doc, idx) => (
                              <div key={idx} style={{ marginBottom: '0.25rem' }}>
                                <a
                                  href="#"
                                  onClick={(e) => { e.preventDefault(); viewDocument(doc.path); }}
                                  style={{ color: '#6366f1', textDecoration: 'none', marginRight: '0.5rem', fontSize: '0.875rem' }}
                                >
                                  {doc.type}
                                </a>
                                <span style={{
                                  padding: '0.125rem 0.5rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: '600',
                                  background: doc.status === 'pending' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                                  color: doc.status === 'pending' ? '#f59e0b' : '#10b981'
                                }}>
                                  {doc.status}
                                </span>
                              </div>
                            ))
                          )}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{
                            padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600',
                            background: req.status === 'pending' ? 'rgba(245, 158, 11, 0.2)' : 
                                       req.status === 'verified' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                            color: req.status === 'pending' ? '#f59e0b' : 
                                   req.status === 'verified' ? '#10b981' : '#ef4444'
                          }}>
                            {req.status === 'verified' ? 'Approved' : req.status === 'pending' ? 'Pending' : 'Rejected'}
                          </span>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          {!showHistory ? (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button onClick={() => verifyUser(req.user_id, 'approve')} style={{
                                display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.75rem',
                                background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: 'none', borderRadius: '0.375rem',
                                cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500'
                              }}>
                                <CheckIcon size={14} /> Approve
                              </button>
                              <button onClick={() => verifyUser(req.user_id, 'reject')} style={{
                                display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.75rem',
                                background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: 'none', borderRadius: '0.375rem',
                                cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500'
                              }}>
                                <XIcon size={14} /> Reject
                              </button>
                            </div>
                          ) : (
                            <span style={{ color: colors.textSecondary, fontSize: '0.875rem' }}>
                              Admin
                            </span>
                          )}
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
              <div style={{ 
                textAlign: 'center', 
                padding: '3rem', 
                background: colors.bgCard,
                borderRadius: '1rem',
                border: `1px solid ${colors.border}`,
                boxShadow: theme === 'light' ? '0 4px 20px rgba(0,0,0,0.08)' : 'none'
              }}>
                <DollarIcon size={64} style={{ margin: '0 auto 1rem', color: colors.textMuted }} />
                <h3 style={{ color: colors.textPrimary }}>No Pending Loan Requests</h3>
                <p style={{ color: colors.textMuted }}>All loan applications have been processed</p>
              </div>
            ) : (
              <div style={{ 
                background: colors.bgCard,
                borderRadius: '1rem',
                border: `1px solid ${colors.border}`,
                overflow: 'hidden',
                boxShadow: theme === 'light' ? '0 4px 20px rgba(0,0,0,0.08)' : 'none'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${colors.border}`, background: colors.bgSecondary }}>
                      <th style={{ padding: '1rem', textAlign: 'left', color: colors.textSecondary, fontWeight: '600', fontSize: '0.875rem' }}>ID</th>
                      <th style={{ padding: '1rem', textAlign: 'left', color: colors.textSecondary, fontWeight: '600', fontSize: '0.875rem' }}>Customer</th>
                      <th style={{ padding: '1rem', textAlign: 'left', color: colors.textSecondary, fontWeight: '600', fontSize: '0.875rem' }}>Amount</th>
                      <th style={{ padding: '1rem', textAlign: 'left', color: colors.textSecondary, fontWeight: '600', fontSize: '0.875rem' }}>Term</th>
                      <th style={{ padding: '1rem', textAlign: 'left', color: colors.textSecondary, fontWeight: '600', fontSize: '0.875rem' }}>Purpose</th>
                      <th style={{ padding: '1rem', textAlign: 'left', color: colors.textSecondary, fontWeight: '600', fontSize: '0.875rem' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loanRequests.map(loan => (
                      <tr key={loan.loan_id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                        <td style={{ padding: '1rem', color: colors.textPrimary }}><strong>#{loan.loan_id}</strong></td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ color: colors.textPrimary, fontWeight: '600' }}>{loan.customer_name}</div>
                          <div style={{ fontSize: '0.875rem', color: colors.textSecondary }}>{loan.email}</div>
                        </td>
                        <td style={{ padding: '1rem' }}><strong style={{ color: '#10b981' }}>${loan.amount.toLocaleString()}</strong></td>
                        <td style={{ padding: '1rem', color: colors.textSecondary }}>{loan.term} months</td>
                        <td style={{ padding: '1rem', color: colors.textSecondary }}>{loan.purpose}</td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => openNoteModal(loan.loan_id, 'approve')} style={{
                              display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.75rem',
                              background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: 'none', borderRadius: '0.375rem',
                              cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500'
                            }}>
                              <CheckIcon size={14} /> Approve
                            </button>
                            <button onClick={() => openNoteModal(loan.loan_id, 'reject')} style={{
                              display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.75rem',
                              background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: 'none', borderRadius: '0.375rem',
                              cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500'
                            }}>
                              <XIcon size={14} /> Reject
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
              <button onClick={() => setShowModal(true)} style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem',
                background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)', color: 'white',
                border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '600'
              }}>
                <UsersIcon size={20} />
                Add New Admin
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {admins.map(admin => (
                <div key={admin.id} style={{ 
                  padding: '1.5rem', 
                  background: colors.bgCard, 
                  borderRadius: '1rem',
                  border: `1px solid ${colors.border}`,
                  boxShadow: theme === 'light' ? '0 4px 20px rgba(0,0,0,0.08)' : 'none'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '50%',
                      background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontSize: '1.25rem', fontWeight: 'bold'
                    }}>
                      {admin.name.charAt(0)}
                    </div>
                    <button onClick={() => deleteAdmin(admin.id)} style={{
                      background: 'none', border: 'none', color: '#ef4444', 
                      cursor: 'pointer', padding: '0.25rem'
                    }}>
                      <XIcon size={16} />
                    </button>
                  </div>
                  <h4 style={{ margin: '0 0 0.25rem 0', color: colors.textPrimary }}>{admin.name}</h4>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: colors.textSecondary }}>{admin.email}</p>
                  <div style={{ marginTop: '1rem' }}>
                    <span style={{
                      padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600',
                      background: 'rgba(16, 185, 129, 0.15)', color: '#10b981'
                    }}>Active</span>
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
            <div style={{ 
              background: colors.bgCard, 
              borderRadius: '1rem', 
              border: `1px solid ${colors.border}`,
              overflow: 'hidden',
              boxShadow: theme === 'light' ? '0 4px 20px rgba(0,0,0,0.08)' : 'none'
            }}>
              <div style={{ padding: '1.5rem', borderBottom: `1px solid ${colors.border}` }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: colors.textPrimary }}>System Analytics</h3>
              </div>
              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                  <div style={{ padding: '1.5rem', background: 'rgba(65, 105, 225, 0.1)', borderRadius: '1rem', border: '1px solid rgba(65, 105, 225, 0.2)' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#6366f1' }}>Total Verifications</h4>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: colors.textPrimary }}>{verifications.length}</p>
                  </div>
                  <div style={{ padding: '1.5rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '1rem', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#10b981' }}>Total Loans</h4>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: colors.textPrimary }}>{loanRequests.length}</p>
                  </div>
                  {isSuper && (
                    <div style={{ padding: '1.5rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '1rem', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: '#f59e0b' }}>Total Admins</h4>
                      <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: colors.textPrimary }}>{admins.length}</p>
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <button onClick={exportExcel} style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 2rem',
                    background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)', color: 'white',
                    border: 'none', borderRadius: '0.75rem', fontSize: '1rem', fontWeight: '600',
                    cursor: 'pointer', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                  }}>
                    <DownloadIcon size={20} />
                    Export Full Report (Excel)
                  </button>
                  <button onClick={() => exportCSV('customers')} style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 2rem',
                    background: colors.bgCard, color: colors.textPrimary,
                    border: `1px solid ${colors.border}`, borderRadius: '0.75rem', fontSize: '1rem', fontWeight: '600',
                    cursor: 'pointer', boxShadow: theme === 'light' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none'
                  }}>
                    <UsersIcon size={20} />
                    Export Customers (CSV)
                  </button>
                  <button onClick={() => exportCSV('loans')} style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 2rem',
                    background: colors.bgCard, color: colors.textPrimary,
                    border: `1px solid ${colors.border}`, borderRadius: '0.75rem', fontSize: '1rem', fontWeight: '600',
                    cursor: 'pointer', boxShadow: theme === 'light' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none'
                  }}>
                    <DollarIcon size={20} />
                    Export Loans (CSV)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Admin Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }} onClick={() => setShowModal(false)}>
          <div style={{
            background: colors.bgCard, width: '100%', maxWidth: '500px', borderRadius: '1.5rem',
            border: `1px solid ${colors.border}`, padding: '2rem', margin: '1rem',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)', animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ marginBottom: '1.5rem', borderBottom: `1px solid ${colors.border}`, paddingBottom: '1rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', color: colors.textPrimary }}>Add New Admin</h2>
            </div>
            <div>
              <form onSubmit={handleCreateAdmin}>
                {['first', 'last'].map(field => (
                  <div key={field} style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: colors.textSecondary, fontSize: '0.875rem' }}>
                      {field.charAt(0).toUpperCase() + field.slice(1)} Name
                    </label>
                    <input
                      value={newAdmin[field]}
                      onChange={e => setNewAdmin({ ...newAdmin, [field]: e.target.value })}
                      required
                      style={{
                        width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem',
                        background: colors.bgInput, border: `1px solid ${colors.border}`,
                        color: colors.textPrimary, outline: 'none', transition: 'all 0.2s',
                        fontSize: '1rem'
                      }}
                    />
                  </div>
                ))}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: colors.textSecondary, fontSize: '0.875rem' }}>Email</label>
                  <input
                    type="email"
                    value={newAdmin.email}
                    onChange={e => setNewAdmin({ ...newAdmin, email: e.target.value })}
                    required
                    style={{
                      width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem',
                      background: colors.bgInput, border: `1px solid ${colors.border}`,
                      color: colors.textPrimary, outline: 'none', transition: 'all 0.2s',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '2rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: colors.textSecondary, fontSize: '0.875rem' }}>Password</label>
                  <input
                    type="password"
                    value={newAdmin.password}
                    onChange={e => setNewAdmin({ ...newAdmin, password: e.target.value })}
                    required
                    style={{
                      width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem',
                      background: colors.bgInput, border: `1px solid ${colors.border}`,
                      color: colors.textPrimary, outline: 'none', transition: 'all 0.2s',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                  <button type="button" onClick={() => setShowModal(false)} style={{
                    padding: '0.75rem 1.5rem', borderRadius: '0.75rem', background: 'transparent',
                    border: `1px solid ${colors.border}`, color: colors.textSecondary, cursor: 'pointer',
                    fontSize: '1rem'
                  }}>
                    Cancel
                  </button>
                  <button type="submit" style={{
                    padding: '0.75rem 1.5rem', borderRadius: '0.75rem', border: 'none',
                    background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)', color: 'white',
                    cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold'
                  }}>
                    Create Admin
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* NEW: Note Modal for Loan Decision */}
      {noteModal.show && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setNoteModal({ show: false, loanId: null, action: null })}>
          <div style={{
            background: colors.bgCard,
            padding: '2rem', borderRadius: '1rem',
            border: `1px solid ${colors.border}`,
            width: '100%', maxWidth: '450px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 1.5rem 0', color: colors.textPrimary }}>
              <span style={{ 
                color: noteModal.action === 'approve' ? '#10b981' : '#ef4444' 
              }}>
                {noteModal.action === 'approve' ? 'Approve' : 'Reject'}
              </span> Loan Request
            </h3>
            
            <form onSubmit={submitLoanDecision}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', color: colors.textSecondary, marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                  Admin Notes (Optional)
                </label>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Reason for approval/rejection or instructions for customer..."
                  rows="4"
                  style={{
                    width: '100%', padding: '0.75rem',
                    background: colors.bgInput,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '0.5rem',
                    color: colors.textPrimary,
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    fontSize: '0.95rem'
                  }}
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setNoteModal({ show: false, loanId: null, action: null })}
                  style={{
                    padding: '0.75rem 1.5rem', background: 'transparent',
                    color: colors.textSecondary,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '500'
                  }}>
                  Cancel
                </button>
                <button type="submit"
                  style={{
                    padding: '0.75rem 1.5rem', 
                    background: noteModal.action === 'approve' 
                      ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)' 
                      : 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
                    color: 'white', border: 'none', 
                    borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '600'
                  }}>
                  Confirm {noteModal.action === 'approve' ? 'Approve' : 'Reject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
