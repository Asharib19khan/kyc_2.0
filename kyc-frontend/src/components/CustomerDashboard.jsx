import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function CustomerDashboard() {
  const [loans, setLoans] = useState([]);
  const [amount, setAmount] = useState('');
  const [term, setTerm] = useState('');
  const [purpose, setPurpose] = useState('');
  
  // Doc Upload State
  const [docType, setDocType] = useState('CNIC');
  const [docNumber, setDocNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [file, setFile] = useState(null);
  
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
      alert('You must be verified to apply for a loan.');
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
      alert('Loan application submitted!');
      fetchLoans();
      setAmount(''); setTerm(''); setPurpose('');
    } else {
      alert('Failed to apply.');
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
    if(data.success) {
      alert('Document uploaded successfully!');
      setFile(null); setDocNumber(''); setExpiry('');
    } else {
      alert('Upload failed');
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div>
      <header>
        <div className="container">
          <h1>Customer Portal</h1>
          <nav>
            <span>Welcome, {user.name} ({user.status})</span>
            <a href="#" onClick={logout}>Logout</a>
          </nav>
        </div>
      </header>

      <div className="container">
        {/* Status Messages for KYC */}
        {user.status === 'pending' && <p className="card status-pending">Your account is pending verification. Please upload documents.</p>}
        {user.status === 'rejected' && <p className="card status-rejected">Your verification was rejected. Contact support.</p>}
        
        {/* Document Upload Section */}
        <div className="card">
          <h2>Upload Documents</h2>
          <form onSubmit={handleUpload}>
            <label>Document Type</label>
            <select value={docType} onChange={e => setDocType(e.target.value)}>
              <option value="CNIC">CNIC</option>
              <option value="Passport">Passport</option>
              <option value="Driving License">Driving License</option>
            </select>

            <label>Document Number</label>
            <input value={docNumber} onChange={e => setDocNumber(e.target.value)} required />

            <label>Expiry Date</label>
            <input type="date" value={expiry} onChange={e => setExpiry(e.target.value)} required />

            <label>Document Image</label>
            <input type="file" onChange={e => setFile(e.target.files[0])} required />

            <button type="submit">Upload Document</button>
          </form>
        </div>

        {user.status === 'verified' && (
          <div className="card">
            <h2>Apply for a Loan</h2>
            <form onSubmit={applyLoan}>
              <label>Amount ($)</label>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} required />
              
              <label>Term (Months)</label>
              <input type="number" value={term} onChange={e => setTerm(e.target.value)} required />
              
              <label>Purpose</label>
              <input value={purpose} onChange={e => setPurpose(e.target.value)} required />
              
              <button type="submit">Submit Application</button>
            </form>
          </div>
        )}

        <div className="card">
          <h2>My Loans</h2>
          <table>
            <thead>
              <tr>
                <th>Loan ID</th>
                <th>Amount</th>
                <th>Term</th>
                <th>Purpose</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {loans.map(loan => (
                <tr key={loan.loan_id}>
                  <td>{loan.loan_id}</td>
                  <td>${loan.amount}</td>
                  <td>{loan.term} mo</td>
                  <td>{loan.purpose}</td>
                  <td className={`status-${loan.status}`}>{loan.status.toUpperCase()}</td>
                  <td>{loan.applied_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default CustomerDashboard;
