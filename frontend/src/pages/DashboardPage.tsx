import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getEmployees } from '../api/employees';
import { getTimesheets } from '../api/timesheets';
import { getLeaveRequests } from '../api/leaveRequests';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import type { Employee, Timesheet, LeaveRequest } from '../types/models';

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    approved: 'badge-success', pending: 'badge-warning', rejected: 'badge-danger',
    active: 'badge-success', on_leave: 'badge-info', terminated: 'badge-danger',
  };
  return `badge ${map[status] ?? 'badge-neutral'}`;
};

const typeBadge = (type: string) => {
  const map: Record<string, string> = {
    sick: 'badge-danger', vacation: 'badge-info', personal: 'badge-purple',
  };
  return `badge ${map[type] ?? 'badge-neutral'}`;
};

const getInitials = (first: string, last: string) =>
  `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase();

const avatarVariants = ['', ' alt', ' alt2', ' alt3'];

/* ─────────────────────────────────────────────
   MANAGER / ADMIN VIEW
   ───────────────────────────────────────────── */
const ManagerDashboard = ({
  employees, timesheets, leaveRequests,
}: { employees: Employee[]; timesheets: Timesheet[]; leaveRequests: LeaveRequest[] }) => {
  const navigate = useNavigate();
  const active     = employees.filter(e => e.employment_status === 'active').length;
  const pending_ts = timesheets.filter(t => t.status === 'pending').length;
  const pending_lr = leaveRequests.filter(l => l.status === 'pending').length;
  const recentEmployees = [...employees].slice(0, 6);
  const recentLeave     = [...leaveRequests].slice(0, 5);

  return (
    <>
      <div className="stats-grid">
        {[
          { icon: '👥', label: 'Total Employees',    value: employees.length, color: 'blue'   },
          { icon: '✅', label: 'Active Staff',         value: active,           color: 'green'  },
          { icon: '⏱', label: 'Pending Timesheets',  value: pending_ts,       color: 'yellow' },
          { icon: '🗓', label: 'Pending Leave',        value: pending_lr,       color: 'purple' },
        ].map(s => (
          <div key={s.label} className={`stat-card ${s.color}`}>
            <div className={`stat-icon ${s.color}`}>{s.icon}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Team Members</span>
            <a href="/employees" className="btn btn-ghost btn-sm" onClick={e => { e.preventDefault(); navigate('/employees'); }}>View all →</a>
          </div>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Employee</th><th>Dept</th><th>Status</th></tr></thead>
              <tbody>
                {recentEmployees.map((emp, i) => (
                  <tr key={emp.id}>
                    <td>
                      <div className="user-cell">
                        <div className={`avatar-sm${avatarVariants[i % 4]}`}>{getInitials(emp.first_name, emp.last_name)}</div>
                        <div>
                          <div className="user-cell-name">{emp.first_name} {emp.last_name}</div>
                          <div className="user-cell-sub">{emp.job_title}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="chip">{emp.department}</span></td>
                    <td><span className={statusBadge(emp.employment_status)}>{emp.employment_status.replace('_', ' ')}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Leave Requests</span>
            <a href="/leave-requests" className="btn btn-ghost btn-sm" onClick={e => { e.preventDefault(); navigate('/leave-requests'); }}>View all →</a>
          </div>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Employee #</th><th>Type</th><th>Dates</th><th>Status</th></tr></thead>
              <tbody>
                {recentLeave.length === 0 ? (
                  <tr><td colSpan={4}><div className="empty-state"><p>No leave requests</p></div></td></tr>
                ) : recentLeave.map(lr => (
                  <tr key={lr.id}>
                    <td className="td-primary">#{lr.employee}</td>
                    <td><span className={typeBadge(lr.leave_type)}>{lr.leave_type}</span></td>
                    <td className="text-sm text-secondary">{lr.start_date} → {lr.end_date}</td>
                    <td><span className={statusBadge(lr.status)}>{lr.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

/* ─────────────────────────────────────────────
   EMPLOYEE (SELF) VIEW
   ───────────────────────────────────────────── */
const EmployeeDashboard = ({
  timesheets, leaveRequests, user,
}: { timesheets: Timesheet[]; leaveRequests: LeaveRequest[]; user: Employee }) => {
  const navigate = useNavigate();
  const approvedHours = timesheets
    .filter(t => t.status === 'approved')
    .reduce((sum, t) => sum + parseFloat(t.hours_worked ?? '0'), 0);
  const pendingLeave = leaveRequests.filter(l => l.status === 'pending').length;
  const recentTs = [...timesheets].slice(0, 5);
  const recentLr = [...leaveRequests].slice(0, 4);

  return (
    <>
      {/* Profile card */}
      <div className="card" style={{ marginBottom: 20, padding: 28, display: 'flex', alignItems: 'center', gap: 24 }}>
        <div className="avatar" style={{ width: 64, height: 64, fontSize: 24 }}>
          {getInitials(user.first_name, user.last_name)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>{user.first_name} {user.last_name}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 3 }}>{user.job_title} · {user.department}</div>
          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
            <span className={statusBadge(user.employment_status)}>{user.employment_status.replace('_', ' ')}</span>
            <span className="badge badge-info">{user.role}</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)' }}>{approvedHours.toFixed(0)}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Approved Hours</div>
          </div>
          <div>
            <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--warning)' }}>{pendingLeave}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Pending Leave</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* My Timesheets */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">My Timesheets</span>
            <a href="/timesheets" className="btn btn-ghost btn-sm" onClick={e => { e.preventDefault(); navigate('/timesheets'); }}>View all →</a>
          </div>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Date</th><th>Hours</th><th>Status</th></tr></thead>
              <tbody>
                {recentTs.length === 0 ? (
                  <tr><td colSpan={3}><div className="empty-state" style={{ padding: 30 }}><p>No timesheet entries yet</p></div></td></tr>
                ) : recentTs.map(t => (
                  <tr key={t.id}>
                    <td className="td-primary">{t.work_date}</td>
                    <td><strong style={{ color: 'var(--text-primary)' }}>{parseFloat(t.hours_worked ?? '0').toFixed(1)}h</strong></td>
                    <td><span className={statusBadge(t.status)}>{t.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* My Leave Requests */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">My Leave Requests</span>
            <a href="/leave-requests" className="btn btn-ghost btn-sm" onClick={e => { e.preventDefault(); navigate('/leave-requests'); }}>View all →</a>
          </div>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Type</th><th>Dates</th><th>Status</th></tr></thead>
              <tbody>
                {recentLr.length === 0 ? (
                  <tr><td colSpan={3}><div className="empty-state" style={{ padding: 30 }}><p>No leave requests yet</p></div></td></tr>
                ) : recentLr.map(lr => (
                  <tr key={lr.id}>
                    <td><span className={typeBadge(lr.leave_type)}>{lr.leave_type}</span></td>
                    <td className="text-sm text-secondary">{lr.start_date} → {lr.end_date}</td>
                    <td><span className={statusBadge(lr.status)}>{lr.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

/* ─────────────────────────────────────────────
   MAIN DASHBOARD PAGE
   ───────────────────────────────────────────── */
const DashboardPage = () => {
  const { user } = useAuth();
  const [employees, setEmployees]       = useState<Employee[]>([]);
  const [timesheets, setTimesheets]     = useState<Timesheet[]>([]);
  const [leaveRequests, setLeaveReqs]   = useState<LeaveRequest[]>([]);
  const [loading, setLoading]           = useState(true);

  const isManagerOrAdmin = user?.role === 'admin' || user?.role === 'manager';

  useEffect(() => {
    Promise.all([getEmployees(), getTimesheets(), getLeaveRequests()])
      .then(([e, t, l]) => { setEmployees(e); setTimesheets(t); setLeaveReqs(l); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="page-loading"><div className="spinner" /><span>Loading dashboard…</span></div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div className="page-header-left">
          <h2>
            {isManagerOrAdmin
              ? `Good morning, ${user?.first_name} 👋`
              : `Welcome back, ${user?.first_name} 👋`}
          </h2>
          <p>
            {isManagerOrAdmin
              ? "Here's what's happening across your organisation today."
              : `Viewing your personal workspace · ${user?.department}`}
          </p>
        </div>
      </div>

      {isManagerOrAdmin ? (
        <ManagerDashboard employees={employees} timesheets={timesheets} leaveRequests={leaveRequests} />
      ) : (
        <EmployeeDashboard timesheets={timesheets} leaveRequests={leaveRequests} user={user!} />
      )}
    </Layout>
  );
};

export default DashboardPage;
