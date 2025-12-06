import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserIcon, PhoneIcon, CalendarIcon, LockIcon, ShieldIcon, SunIcon, MoonIcon } from './Icons';

function Register() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    cnic: '',
    phone: '',
    dob: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState('dark');
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          email: formData.cnic
        })
      });
      const data = await res.json();

      if (data.success) {
        alert('✅ ' + data.message);
        navigate('/login');
      } else {
        alert('❌ ' + data.message);
      }
    } catch (err) {
      alert('❌ Error registering. Please try again.');
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

  const inputStyle = {
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
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: '500',
    color: colors.textMuted,
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  };

  return (
    <div 
      style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: colors.bg,
        margin: 0,
        padding: '2rem 1rem',
        transition: 'background 0.3s ease',
        overflowY: 'auto',
        overflowX: 'hidden'
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

      {/* Register Card */}
      <div 
        style={{
          width: '100%',
          maxWidth: '480px',
          background: colors.cardBg,
          backdropFilter: 'blur(20px)',
          borderRadius: '1.25rem',
          border: `1px solid ${colors.border}`,
          padding: '2rem',
          boxShadow: theme === 'dark' 
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(99, 102, 241, 0.1)'
            : '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(99, 102, 241, 0.1)',
          animation: 'fadeIn 0.5s ease-out',
          transition: 'all 0.3s ease',
          margin: '0 auto'
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
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
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: colors.text, marginBottom: '0.5rem' }}>
            Create Account
          </h1>
          <p style={{ color: colors.textDim, fontSize: '0.875rem' }}>
            Join our secure KYC platform
          </p>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleRegister}>
          {/* Name Fields - Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={labelStyle}>First Name</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: colors.textDim }}>
                  <UserIcon size={18} />
                </div>
                <input
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="John"
                  required
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Last Name</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: colors.textDim }}>
                  <UserIcon size={18} />
                </div>
                <input
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Doe"
                  required
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          {/* CNIC Number */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>CNIC Number</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: colors.textDim }}>
                <ShieldIcon size={18} />
              </div>
              <input
                type="text"
                name="cnic"
                value={formData.cnic}
                onChange={handleChange}
                placeholder="XXXXX-XXXXXXX-X"
                pattern="[0-9]{5}-[0-9]{7}-[0-9]{1}"
                title="Format: XXXXX-XXXXXXX-X"
                required
                style={inputStyle}
              />
            </div>
            <small style={{ color: colors.textDim, fontSize: '0.7rem', marginTop: '0.25rem', display: 'block' }}>
              Format: XXXXX-XXXXXXX-X
            </small>
          </div>

          {/* Phone */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>Phone Number</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: colors.textDim }}>
                <PhoneIcon size={18} />
              </div>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+92 XXX XXXXXXX"
                required
                style={inputStyle}
              />
            </div>
          </div>

          {/* Date of Birth */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>Date of Birth</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: colors.textDim }}>
                <CalendarIcon size={18} />
              </div>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                required
                style={inputStyle}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={labelStyle}>Password</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: colors.textDim }}>
                <LockIcon size={18} />
              </div>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a strong password"
                required
                minLength="6"
                style={inputStyle}
              />
            </div>
            <small style={{ color: colors.textDim, fontSize: '0.7rem', marginTop: '0.25rem', display: 'block' }}>
              Minimum 6 characters
            </small>
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
            {loading ? 'Creating Account...' : (
              <>
                <ShieldIcon size={18} />
                Create Account
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div style={{ marginTop: '1.25rem', textAlign: 'center', color: colors.textDim, fontSize: '0.875rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#818cf8', textDecoration: 'none', fontWeight: '600' }}>
            Login Here
          </Link>
        </div>

        {/* Security Notice */}
        <div style={{
          marginTop: '1.25rem',
          padding: '0.875rem',
          background: theme === 'dark' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: '0.5rem',
          fontSize: '0.75rem',
          color: colors.textMuted,
          textAlign: 'center'
        }}>
          🔒 Your data is encrypted with AES-256 and passwords are hashed with Argon2
        </div>
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

export default Register;
