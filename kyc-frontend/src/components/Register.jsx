import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Register() {
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', email: '', phone: '', dob: '', password: ''
  });
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        navigate('/login');
      } else {
        alert(data.message);
      }
    } catch {
      alert('Error registering');
    }
  };

  return (
    <div className="auth-form card">
      <h2>Customer Registration</h2>
      <form onSubmit={handleRegister}>
        <label>First Name</label>
        <input name="first_name" onChange={handleChange} required />
        
        <label>Last Name</label>
        <input name="last_name" onChange={handleChange} required />
        
        <label>Email</label>
        <input type="email" name="email" onChange={handleChange} required />
        
        <label>Phone</label>
        <input name="phone" onChange={handleChange} required />
        
        <label>Date of Birth</label>
        <input type="date" name="dob" onChange={handleChange} required />
        
        <label>Password</label>
        <input type="password" name="password" onChange={handleChange} required />
        
        <button type="submit">Register</button>
      </form>
      <p>Already have an account? <Link to="/login">Login</Link></p>
    </div>
  );
}

export default Register;
