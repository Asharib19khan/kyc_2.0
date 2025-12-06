import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserIcon, LockIcon, ShieldIcon, SunIcon, MoonIcon } from './Icons';

function Login() {
  const [cnic, setCnic] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer');
  const [theme, setTheme] = useState('dark');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
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

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      let loginRole = role;
      if (role === 'admin' && cnic === 'super') {
        loginRole = 'super_admin';
      }
      
      const res = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cnic, password, role: loginRole })
      });
      const data = await res.json();
      
      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        if (data.user.role === 'admin' || data.user.role === 'super_admin') {
          navigate('/admin');
        } else {
          navigate('/customer');
        }
      } else {
        alert(data.message || 'Invalid credentials');
      }
    } catch (err) {
      alert('Login failed. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Theme-aware colors
  const colors = theme === 'dark' ? {
    bg: 'linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 50%, #16162a 100%)',
    cardBg: 'rgba(22, 22, 42, 0.95)',
    inputBg: 'rgba(15, 15, 30, 0.6)',
    border: 'rgba(255, 255, 255, 0.08)',
    text: '#f1f5f9',
    textMuted: '#94a3b8',
    textDim: '#64748b',
    placeholder: '#475569'
  } : {
    bg: 'linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 50%, #f8fafc 100%)',
    cardBg: 'rgba(255, 255, 255, 0.98)',
    inputBg: 'rgba(241, 245, 249, 0.8)',
    border: 'rgba(0, 0, 0, 0.1)',
    text: '#1a202c',
    textMuted: '#4a5568',
    textDim: '#718096',
    placeholder: '#a0aec0'
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: colors.bg,
        margin: 0,
        padding: '1rem',
        transition: 'background 0.3s ease'
      }}
    >
      {/* Theme Toggle */}
      <button 
        onClick={toggleTheme} 
        aria-label="Toggle theme"
        style={{
          position: 'fixed',
          top: '1.5rem',
          right: '1.5rem',
          width: '45px',
          height: '45px',
          borderRadius: '50%',
          background: theme === 'dark' ? 'rgba(30, 30, 56, 0.8)' : 'rgba(255, 255, 255, 0.9)',
          border: `1px solid ${colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: colors.textMuted,
          transition: 'all 0.3s ease',
          zIndex: 1000,
          boxShadow: theme === 'light' ? '0 2px 10px rgba(0,0,0,0.1)' : 'none'
        }}
      >
        {theme === 'dark' ? <SunIcon size={20} /> : <MoonIcon size={20} />}
      </button>

      {/* Login Card */}
      <div 
        style={{
          width: '100%',
          maxWidth: '400px',
          background: colors.cardBg,
          backdropFilter: 'blur(20px)',
          borderRadius: '1.25rem',
          border: `1px solid ${colors.border}`,
          padding: '2.5rem 2rem',
          boxShadow: theme === 'dark' 
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(99, 102, 241, 0.1)'
            : '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(99, 102, 241, 0.1)',
          animation: 'fadeIn 0.5s ease-out',
          transition: 'all 0.3s ease'
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div 
            style={{
              width: '56px',
              height: '56px',
              margin: '0 auto 1rem',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              borderRadius: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 10px 30px rgba(99, 102, 241, 0.3)'
            }}
          >
            <ShieldIcon size={28} color="white" />
          </div>
          <h1 
            style={{ 
              fontSize: '1.75rem', 
              fontWeight: '700', 
              color: colors.text,
              marginBottom: '0.5rem',
              letterSpacing: '-0.02em',
              transition: 'color 0.3s ease'
            }}
          >
            KYC Portal
          </h1>
          <p style={{ color: colors.textDim, fontSize: '0.875rem', transition: 'color 0.3s ease' }}>
            Secure KYC & Banking Portal
          </p>
        </div>

        {/* Role Tabs */}
        <div 
          style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '1.75rem',
            background: colors.inputBg,
            padding: '0.375rem',
            borderRadius: '0.75rem',
            border: `1px solid ${colors.border}`,
            transition: 'all 0.3s ease'
          }}
        >
          <button
            onClick={() => setRole('customer')}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              background: role === 'customer' ? 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)' : 'transparent',
              color: role === 'customer' ? 'white' : colors.textMuted,
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease',
              boxShadow: role === 'customer' ? '0 4px 12px rgba(99, 102, 241, 0.4)' : 'none'
            }}
          >
            <UserIcon size={16} />
            Customer
          </button>
          <button
            onClick={() => setRole('admin')}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              background: role === 'admin' ? 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)' : 'transparent',
              color: role === 'admin' ? 'white' : colors.textMuted,
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease',
              boxShadow: role === 'admin' ? '0 4px 12px rgba(99, 102, 241, 0.4)' : 'none'
            }}
          >
            <ShieldIcon size={16} />
            Admin Portal
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin}>
          {/* CNIC/Username Input */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label 
              style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '500', 
                color: colors.textMuted,
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                transition: 'color 0.3s ease'
              }}
            >
              {role === 'customer' ? 'CNIC Number' : 'Username'}
            </label>
            <div style={{ position: 'relative' }}>
              <div 
                style={{ 
                  position: 'absolute', 
                  left: '1rem', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  color: colors.textDim
                }}
              >
                <UserIcon size={18} />
              </div>
              <input
                type="text"
                value={cnic}
                onChange={(e) => setCnic(e.target.value)}
                placeholder={role === 'customer' ? 'XXXXX-XXXXXXX-X' : 'Enter username'}
                required
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem 0.875rem 3rem',
                  fontSize: '0.9375rem',
                  background: colors.inputBg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '0.625rem',
                  color: colors.text,
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Password Input */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label 
              style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '500', 
                color: colors.textMuted,
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                transition: 'color 0.3s ease'
              }}
            >
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <div 
                style={{ 
                  position: 'absolute', 
                  left: '1rem', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  color: colors.textDim
                }}
              >
                <LockIcon size={18} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem 0.875rem 3rem',
                  fontSize: '0.9375rem',
                  background: colors.inputBg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '0.625rem',
                  color: colors.text,
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.9375rem',
              background: 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '0.625rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              fontSize: '0.9375rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? (
              'Logging in...'
            ) : (
              <>
                Login Securely
                <span style={{ marginLeft: '0.25rem' }}>→</span>
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        {role === 'customer' && (
          <div 
            style={{ 
              marginTop: '1.5rem', 
              textAlign: 'center', 
              color: colors.textDim,
              fontSize: '0.875rem',
              transition: 'color 0.3s ease'
            }}
          >
            Don't have an account?{' '}
            <Link 
              to="/register" 
              style={{ 
                color: '#818cf8', 
                textDecoration: 'none',
                fontWeight: '600'
              }}
            >
              Register Now
            </Link>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        input::placeholder { color: ${colors.placeholder}; }
        input:focus { 
          border-color: rgba(99, 102, 241, 0.5) !important; 
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1) !important;
        }
      `}</style>
    </div>
  );
}

export default Login;
