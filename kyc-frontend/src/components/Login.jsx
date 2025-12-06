import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        if (data.user.role === 'admin' || data.user.role === 'super_admin') navigate('/admin');
        else navigate('/customer');
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Login failed');
    }
  };

  return (
    <div className="auth-form card">
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <label>Role</label>
        <select value={role} onChange={e => setRole(e.target.value)}>
          <option value="customer">Customer</option>
          <option value="admin">Admin</option>
          <option value="super_admin">Super Admin</option>
        </select>
        
        <label>{(role === 'admin' || role === 'super_admin') ? 'Username' : 'Email'}</label>
        <input value={email} onChange={e => setEmail(e.target.value)} required />
        
        <label>Password</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        
        <button type="submit">Login</button>
      </form>
      {role === 'customer' && <p>Don't have an account? <Link to="/register">Register</Link></p>}
    </div>
  );
}

export default Login;
