import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { createEmployee } from '../api/employees';

const RegisterEmployeePage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    job_title: '',
    department: '',
    hire_date: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      // Clean up empty password so backend can use default
      const payload: any = { ...formData };
      if (!payload.password) {
        delete payload.password;
      }
      await createEmployee(payload);
      navigate('/employees');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to register employee. Please check the details and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <Layout>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Register New Employee</h2>
          <p>Add a new member to your organisation.</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && (
            <div className="error-banner">
              ⚠ {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label>First Name</label>
              <input name="first_name" required value={formData.first_name} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input name="last_name" required value={formData.last_name} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <label>Username</label>
            <input name="username" required value={formData.username} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input type="email" name="email" required value={formData.email} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Initial Password</label>
            <input type="password" name="password" placeholder="Defaults to 'password123' if left blank" value={formData.password} onChange={handleChange} />
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: '8px 0' }} />

          <div className="form-group">
            <label>Job Title</label>
            <input name="job_title" required value={formData.job_title} onChange={handleChange} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label>Department</label>
              <input name="department" required value={formData.department} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Hire Date</label>
              <input type="date" name="hire_date" required value={formData.hire_date} onChange={handleChange} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/employees')} disabled={isLoading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? 'Registering...' : 'Register Employee'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default RegisterEmployeePage;
