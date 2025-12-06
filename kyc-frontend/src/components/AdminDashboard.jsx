import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminDashboard() {
  const [verifications, setVerifications] = useState([]);
  const [loanRequests, setLoanRequests] = useState([]);
  const [admins, setAdmins] = useState([]);
  
  // New Admin Form State
  const [newAdmin, setNewAdmin] = useState({ first: '', last: '', email: '', password: '' });
  
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
      .then(data => { if(data.success) setVerifications(data.data) });
      
    fetch('http://localhost:5000/admin/loan-requests', { headers })
      .then(res => res.json())
      .then(data => { if(data.success) setLoanRequests(data.data) });

    if (isSuper) {
       fetch('http://localhost:5000/super/admins', { headers })
        .then(res => res.json())
        .then(data => { if(data.success) setAdmins(data.data) });
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
    fetchData();
  };

  const deleteAdmin = async (id) => {
    if(!confirm("Delete this admin?")) return;
    await fetch('http://localhost:5000/super/delete-admin', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': localStorage.getItem('token')
      },
      body: JSON.stringify({ admin_id: id })
    });
    fetchData();
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
    }
  };

  const exportExcel = async () => {
    const res = await fetch('http://localhost:5000/export/excel', {
      headers: { 'Authorization': localStorage.getItem('token') }
    });
    const data = await res.json();
    if (data.success) {
      window.open('http://localhost:5000' + data.download_url, '_blank');
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
    <div>
      <header>
        <div className="container">
          <h1>{isSuper ? 'Super Admin Portal' : 'Admin Portal'}</h1>
          <nav>
            <a href="#" onClick={exportExcel}>Export Excel Report</a>
            <a href="#" onClick={logout}>Logout</a>
          </nav>
        </div>
      </header>

      <div className="container">
        
        {isSuper && (
          <div className="card">
            <h2>Manage Admins</h2>
            <div style={{display: 'flex', gap: '20px'}}>
              <div style={{flex: 1}}>
                <h3>Admins List</h3>
                <ul>
                  {admins.map(adm => (
                    <li key={adm.id} style={{marginBottom: '10px', display: 'flex', justifyContent: 'space-between'}}>
                      <span>{adm.name} ({adm.email})</span>
                      <button className="danger" onClick={() => deleteAdmin(adm.id)}>Delete</button>
                    </li>
                  ))}
                </ul>
              </div>
              <div style={{flex: 1}}>
                <h3>Add New Admin</h3>
                <form onSubmit={handleCreateAdmin}>
                   <input placeholder="First Name" value={newAdmin.first} onChange={e=>setNewAdmin({...newAdmin, first: e.target.value})} required />
                   <input placeholder="Last Name" value={newAdmin.last} onChange={e=>setNewAdmin({...newAdmin, last: e.target.value})} required />
                   <input placeholder="Email" value={newAdmin.email} onChange={e=>setNewAdmin({...newAdmin, email: e.target.value})} required />
                   <input type="password" placeholder="Password" value={newAdmin.password} onChange={e=>setNewAdmin({...newAdmin, password: e.target.value})} required />
                   <button type="submit">Create Admin</button>
                </form>
              </div>
            </div>
          </div>
        )}

        <div className="card">
          <h2>Pending Verifications</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Docs</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {verifications.map(req => (
                <tr key={req.user_id}>
                  <td>
                    {req.name}<br/>
                    <small>{req.email}</small>
                  </td>
                  <td>
                    {req.documents.length === 0 ? 'No Docs' : 
                      req.documents.map((doc, idx) => (
                        <div key={idx}>
                          <a href="#" onClick={() => viewDocument(doc.path)}>{doc.type}</a> <small>({doc.status})</small>
                        </div>
                      ))
                    }
                  </td>
                  <td>
                    <button onClick={() => verifyUser(req.user_id, 'approve')}>Approve</button>
                    {' '}
                    <button className="danger" onClick={() => verifyUser(req.user_id, 'reject')}>Reject</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {verifications.length === 0 && <p>No pending verifications.</p>}
        </div>

        <div className="card">
          <h2>Loan Requests</h2>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Term</th>
                <th>Purpose</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loanRequests.map(loan => (
                <tr key={loan.loan_id}>
                  <td>{loan.loan_id}</td>
                  <td>
                    {loan.customer_name}<br/>
                    <small>{loan.email}</small>
                  </td>
                  <td>${loan.amount}</td>
                  <td>{loan.term} mo</td>
                  <td>{loan.purpose}</td>
                  <td>
                    <button onClick={() => decideLoan(loan.loan_id, 'approve')}>Approve</button>
                    {' '}
                    <button className="danger" onClick={() => decideLoan(loan.loan_id, 'reject')}>Reject</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {loanRequests.length === 0 && <p>No pending loan requests.</p>}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
