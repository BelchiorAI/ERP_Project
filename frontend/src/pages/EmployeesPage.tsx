import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getEmployees, updateEmployee } from '../api/employees';
import type { Employee } from '../types/models';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const getInitials = (first: string, last: string) =>
  `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase();

const avatarVariants = ['', ' alt', ' alt2', ' alt3'];

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    active: 'badge-success', on_leave: 'badge-info', terminated: 'badge-danger',
  };
  return `badge ${map[status] ?? 'badge-neutral'}`;
};

const roleBadge = (role: string) => {
  const map: Record<string, string> = {
    admin: 'badge-purple', manager: 'badge-info', employee: 'badge-neutral',
  };
  return `badge ${map[role] ?? 'badge-neutral'}`;
};

const EmployeesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [dept, setDept]           = useState('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = () => {
    getEmployees().then(setEmployees).finally(() => setLoading(false));
  };

  const handleToggleCanCreate = async (empId: number, currentVal: boolean) => {
    try {
      await updateEmployee(empId, { can_create_users: !currentVal });
      fetchEmployees();
    } catch (err) {
      console.error('Failed to update permission', err);
    }
  };

  const departments = [...new Set(employees.map(e => e.department))].sort();

  const filtered = employees.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = !q || `${e.first_name} ${e.last_name} ${e.email} ${e.job_title}`.toLowerCase().includes(q);
    const matchDept   = !dept || e.department === dept;
    return matchSearch && matchDept;
  });

  if (loading) {
    return (
      <Layout>
        <div className="page-loading"><div className="spinner" /><span>Loading employees…</span></div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Employees</h2>
          <p>{employees.length} total employees across the organisation</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">All Employees</span>
          <div className="flex gap-2 items-center" style={{ flexWrap: 'wrap' }}>
            <div className="search-bar">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search employees…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: 220 }}
              />
            </div>
            <select
              value={dept}
              onChange={e => setDept(e.target.value)}
              style={{ width: 180, padding: '9px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '13px' }}
            >
              <option value="">All Departments</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            {(user?.role === 'admin' || (user?.role === 'manager' && user?.can_create_users)) && (
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/employees/new')}>
                Register Employee
              </button>
            )}
          </div>
        </div>

        <div className="table-wrapper">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <h3>No employees found</h3>
              <p>Try adjusting your search or filter</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Job Title</th>
                  <th>Role</th>
                  <th>Hire Date</th>
                  <th>Status</th>
                  {user?.role === 'admin' && <th>Permissions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp, i) => (
                  <tr key={emp.id}>
                    <td>
                      <div className="user-cell">
                        <div className={`avatar-sm${avatarVariants[i % 4]}`}>
                          {getInitials(emp.first_name, emp.last_name)}
                        </div>
                        <div>
                          <div className="user-cell-name">{emp.first_name} {emp.last_name}</div>
                          <div className="user-cell-sub">{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="chip">{emp.department}</span></td>
                    <td className="td-primary">{emp.job_title}</td>
                    <td><span className={roleBadge(emp.role)}>{emp.role}</span></td>
                    <td>{emp.hire_date}</td>
                    <td><span className={statusBadge(emp.employment_status)}>{emp.employment_status.replace('_', ' ')}</span></td>
                    {user?.role === 'admin' && (
                      <td>
                        {emp.role === 'manager' && (
                          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                            <input 
                              type="checkbox" 
                              checked={emp.can_create_users || false}
                              onChange={() => handleToggleCanCreate(emp.id, emp.can_create_users)}
                            />
                            Can create users
                          </label>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default EmployeesPage;
