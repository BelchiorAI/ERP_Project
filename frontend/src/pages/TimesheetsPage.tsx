import { useEffect, useState, useCallback } from 'react';
import Layout from '../components/Layout';
import { getTimesheets, createTimesheet, updateTimesheet, deleteTimesheet, getMonthlyReportData, downloadMonthlyReportCsv } from '../api/timesheets';
import type { Timesheet } from '../types/models';
import { useAuth } from '../context/AuthContext';


/* ─── helpers ─────────────────────────────────────────────────────────────── */
const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    approved: 'badge-success', pending: 'badge-warning', rejected: 'badge-danger',
  };
  return `badge ${map[status] ?? 'badge-neutral'}`;
};

const now = () => {
  const d = new Date();
  return d.toTimeString().slice(0, 5); // "HH:MM"
};
const today = () => new Date().toISOString().split('T')[0];

/* ─── ClockOut modal ───────────────────────────────────────────────────────── */
interface ClockOutModalProps {
  timesheet: Timesheet;
  onClose: () => void;
  onSave: (data: { clock_out: string; task_description: string }) => Promise<void>;
}
const ClockOutModal = ({ timesheet, onClose, onSave }: ClockOutModalProps) => {
  const [clockOut, setClockOut] = useState(now());
  const [task, setTask] = useState(timesheet.task_description || '');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clockOut) { setErr('Clock-out time is required.'); return; }
    if (!task.trim()) { setErr('Task description is required.'); return; }
    setSaving(true);
    try {
      await onSave({ clock_out: clockOut, task_description: task });
    } catch {
      setErr('Failed to clock out. Please try again.');
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <div className="modal-header">
          <h3>Clock Out</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {err && <div className="error-banner">⚠ {err}</div>}
          <div className="form-group">
            <label>Clock-out Time</label>
            <input type="time" value={clockOut} required onChange={e => setClockOut(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Task Description <span style={{ color: 'var(--danger)' }}>*</span></label>
            <textarea
              value={task}
              required
              rows={4}
              onChange={e => setTask(e.target.value)}
              placeholder="Describe the work completed during this shift…"
              style={{ resize: 'vertical', background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-sm)', padding: 10, fontSize: 13 }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Clock Out'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─── TimesheetFormModal ───────────────────────────────────────────────────── */
interface TimesheetFormModalProps {
  initial?: Partial<Timesheet>;
  onClose: () => void;
  onSave: (data: Partial<Timesheet>) => Promise<void>;
  isManager: boolean;
}
const TimesheetFormModal = ({ initial, onClose, onSave, isManager }: TimesheetFormModalProps) => {
  const [form, setForm] = useState({
    work_date: initial?.work_date || today(),
    clock_in: initial?.clock_in || now(),
    clock_out: initial?.clock_out || '',
    task_description: initial?.task_description || '',
    status: initial?.status || 'pending',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const isEdit = !!initial?.id;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErr('');
    try {
      await onSave(form);
    } catch (err: any) {
      setErr(err?.response?.data?.detail || 'Failed to save. Please check details.');
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <h3>{isEdit ? 'Edit Timesheet' : 'Create Timesheet'}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {err && <div className="error-banner">⚠ {err}</div>}
          <div className="form-group">
            <label>Work Date</label>
            <input type="date" name="work_date" required value={form.work_date} onChange={handleChange} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label>Clock In</label>
              <input type="time" name="clock_in" required value={form.clock_in} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Clock Out</label>
              <input type="time" name="clock_out" value={form.clock_out} onChange={handleChange} />
            </div>
          </div>
          <div className="form-group">
            <label>Task Description <span style={{ color: 'var(--danger)' }}>*</span></label>
            <textarea
              name="task_description"
              required
              rows={3}
              value={form.task_description}
              onChange={handleChange}
              placeholder="Describe the tasks completed…"
              style={{ resize: 'vertical', background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-sm)', padding: 10, fontSize: 13 }}
            />
          </div>
          {isManager && (
            <div className="form-group">
              <label>Status</label>
              <select name="status" value={form.status} onChange={handleChange}
                style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: 13 }}>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─── MonthlyReportModal ─────────────────────────────────────────────────── */
interface MonthlyReportModalProps {
  onClose: () => void;
}
const MonthlyReportModal = ({ onClose }: MonthlyReportModalProps) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
  const [selectedMonth, setSelectedMonth] = useState(`${currentYear}-${currentMonth}`);
  const [selectedEmployee, setSelectedEmployee] = useState<number | undefined>(undefined);
  const [employees, setEmployees] = useState<{ id: number; first_name: string; last_name: string; username: string }[]>([]);
  const [reportData, setReportData] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [err, setErr] = useState('');

  // Load employees list on mount
  useEffect(() => {
    import('../api/employees').then(mod =>
      mod.getEmployees().then(setEmployees).catch(() => {})
    );
  }, []);

  const fetchReport = useCallback(async (monthStr: string, empId?: number) => {
    if (!monthStr) return;
    const [year, month] = monthStr.split('-').map(Number);
    setLoading(true);
    setErr('');
    try {
      const data = await getMonthlyReportData(year, month, empId);
      setReportData(data);
    } catch {
      setErr('Failed to load monthly report preview.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport(selectedMonth, selectedEmployee);
  }, [selectedMonth, selectedEmployee, fetchReport]);

  const handleDownload = async () => {
    if (!selectedMonth) return;
    const [year, month] = selectedMonth.split('-').map(Number);
    setDownloading(true);
    setErr('');
    try {
      await downloadMonthlyReportCsv(year, month, selectedEmployee);
    } catch {
      setErr('Failed to download CSV report.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 860, width: '92%' }}>
        <div className="modal-header">
          <h3>Monthly Timesheet Report</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {err && <div className="error-banner">⚠ {err}</div>}
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ margin: 0, marginBottom: 4, display: 'block', fontSize: 13 }}>Month</label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(e.target.value)}
                  style={{ width: 170, margin: 0 }}
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ margin: 0, marginBottom: 4, display: 'block', fontSize: 13 }}>Employee</label>
                <select
                  value={selectedEmployee ?? ''}
                  onChange={e => setSelectedEmployee(e.target.value ? Number(e.target.value) : undefined)}
                  style={{
                    width: 220, padding: '9px 12px',
                    background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
                    borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: 13
                  }}
                >
                  <option value="">All Employees</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {`${emp.first_name} ${emp.last_name}`.trim() || emp.username}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              className="btn btn-primary"
              onClick={handleDownload}
              disabled={downloading || reportData.length === 0}
            >
              {downloading ? 'Downloading…' : '📥 Download CSV'}
            </button>
          </div>

          <div className="table-wrapper" style={{ maxHeight: 350, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <div className="spinner" style={{ margin: '0 auto 10px' }} />
                Loading preview…
              </div>
            ) : reportData.length === 0 ? (
              <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No timesheet entries found for the selected filters.
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Work Date</th>
                    <th>Clock In</th>
                    <th>Clock Out</th>
                    <th>Hours</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map(t => (
                    <tr key={t.id}>
                      <td>
                        {t.employee_detail
                          ? `${t.employee_detail.first_name} ${t.employee_detail.last_name}`.trim() || t.employee_detail.username
                          : `Employee #${t.employee}`}
                      </td>
                      <td>{t.work_date}</td>
                      <td>{t.clock_in}</td>
                      <td>{t.clock_out ?? <span style={{ color: 'var(--warning)' }}>Active</span>}</td>
                      <td><strong>{t.hours_worked ? parseFloat(t.hours_worked).toFixed(2) : '—'}</strong></td>
                      <td><span className={statusBadge(t.status)}>{t.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Main Page ────────────────────────────────────────────────────────────── */
const TimesheetsPage = () => {
  const { user } = useAuth();
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Modals
  const [clockOutTarget, setClockOutTarget] = useState<Timesheet | null>(null);
  const [formModal, setFormModal] = useState<{ mode: 'create' | 'edit'; initial?: Partial<Timesheet> } | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const isManagerOrAdmin = user?.role === 'manager' || user?.role === 'admin';
  const isStrictManager = user?.role === 'manager';

  const fetchTimesheets = useCallback(() => {
    setLoading(true);
    getTimesheets().then(setTimesheets).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchTimesheets(); }, [fetchTimesheets]);

  /* find today's open entry for this employee (no clock_out) */
  const openEntry = timesheets.find(
    t => t.employee === user?.id && !t.clock_out && t.work_date === today()
  );

  const filtered = timesheets.filter(t => {
    const q = search.toLowerCase();
    const name = `${t.employee_detail?.first_name ?? ''} ${t.employee_detail?.last_name ?? ''}`.toLowerCase();
    const matchSearch = !q || t.work_date.includes(q) || t.task_description?.toLowerCase().includes(q) || name.includes(q);
    const matchStatus = !statusFilter || t.status === statusFilter;
    const matchDate = (!dateFrom || t.work_date >= dateFrom) && (!dateTo || t.work_date <= dateTo);
    return matchSearch && matchStatus && matchDate;
  });

  const totalHours = timesheets
    .filter(t => t.status === 'approved')
    .reduce((sum, t) => sum + parseFloat(t.hours_worked ?? '0'), 0);

  /* ── Clock In ── */
  const handleClockIn = async () => {
    const clockIn = now();
    const workDate = today();
    try {
      await createTimesheet({ work_date: workDate, clock_in: clockIn, task_description: '' });
      fetchTimesheets();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to clock in.');
    }
  };

  /* ── Clock Out ── */
  const handleClockOut = async (data: { clock_out: string; task_description: string }) => {
    if (!clockOutTarget) return;
    await updateTimesheet(clockOutTarget.id, { ...data, status: 'pending' });
    setClockOutTarget(null);
    fetchTimesheets();
  };

  /* ── Delete ── */
  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this timesheet entry? This action cannot be undone.')) return;
    try {
      await deleteTimesheet(id);
      fetchTimesheets();
    } catch {
      alert('Failed to delete.');
    }
  };

  /* ── Create / Edit ── */
  const handleFormSave = async (data: Partial<Timesheet>) => {
    if (formModal?.mode === 'edit' && formModal.initial?.id) {
      await updateTimesheet(formModal.initial.id, data);
    } else {
      await createTimesheet(data);
    }
    setFormModal(null);
    fetchTimesheets();
  };

  if (loading) return (
    <Layout>
      <div className="page-loading"><div className="spinner" /><span>Loading timesheets…</span></div>
    </Layout>
  );

  return (
    <Layout>
      {/* ── Clock-Out Modal ── */}
      {clockOutTarget && (
        <ClockOutModal
          timesheet={clockOutTarget}
          onClose={() => setClockOutTarget(null)}
          onSave={handleClockOut}
        />
      )}

      {/* ── Create / Edit Modal ── */}
      {formModal && (
        <TimesheetFormModal
          initial={formModal.initial}
          onClose={() => setFormModal(null)}
          onSave={handleFormSave}
          isManager={isManagerOrAdmin}
        />
      )}

      {/* ── Monthly Report Modal ── */}
      {reportModalOpen && (
        <MonthlyReportModal onClose={() => setReportModalOpen(false)} />
      )}

      <div className="page-header">
        <div className="page-header-left">
          <h2>Timesheets</h2>
          <p>{timesheets.length} entries · {totalHours.toFixed(1)} approved hours</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {/* Strict Manager can view/download monthly timesheet report */}
          {isStrictManager && (
            <button className="btn btn-warning btn-sm" onClick={() => setReportModalOpen(true)}>
              📊 Monthly Report
            </button>
          )}
          {/* Clock In / Clock Out for employees */}
          {openEntry
            ? <button className="btn btn-warning btn-sm" onClick={() => setClockOutTarget(openEntry)}>
                Clock Out ↗
              </button>
            : <button className="btn btn-primary btn-sm" onClick={handleClockIn}>
                Clock In ↙
              </button>
          }
          {/* Managers/Admins can manually create a timesheet for any employee */}
          {isManagerOrAdmin && (
            <button className="btn btn-primary btn-sm" onClick={() => setFormModal({ mode: 'create' })}>
              + Create Entry
            </button>
          )}
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {(['pending', 'approved', 'rejected'] as const).map(s => (
          <div key={s} className="stat-card" style={{ padding: 20 }}>
            <div className="stat-value" style={{ fontSize: 28 }}>{timesheets.filter(t => t.status === s).length}</div>
            <div className="stat-label" style={{ textTransform: 'capitalize' }}>{s}</div>
          </div>
        ))}
        <div className="stat-card yellow" style={{ padding: 20 }}>
          <div className="stat-value" style={{ fontSize: 28 }}>{totalHours.toFixed(0)}</div>
          <div className="stat-label">Approved Hours</div>
        </div>
      </div>

      {/* ── Active clock-in banner ── */}
      {openEntry && (
        <div style={{ background: 'rgba(var(--warning-rgb, 255,193,7), 0.15)', border: '1px solid var(--warning, #ffc107)', borderRadius: 'var(--radius)', padding: '12px 18px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>⏱ You are currently clocked in since <strong>{openEntry.clock_in}</strong></span>
          <button className="btn btn-warning btn-sm" onClick={() => setClockOutTarget(openEntry)}>Clock Out</button>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <span className="card-title">All Timesheet Entries</span>
          <div className="flex gap-2 items-center" style={{ flexWrap: 'wrap' }}>
            <div className="search-bar">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search by date or task…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: 220 }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                title="From date"
                max={dateTo || undefined}
                style={{ width: 145, padding: '9px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '13px' }}
              />
              <span style={{ color: 'var(--text-muted)' }}>–</span>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                title="To date"
                min={dateFrom || undefined}
                style={{ width: 145, padding: '9px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '13px' }}
              />
              {(dateFrom || dateTo) && (
                <button
                  className="btn btn-ghost btn-xs"
                  onClick={() => { setDateFrom(''); setDateTo(''); }}
                  title="Clear date filter"
                >
                  ✕
                </button>
              )}
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatus(e.target.value)}
              style={{ width: 140, padding: '9px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '13px' }}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="table-wrapper">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">⏱</div>
              <h3>No timesheet entries found</h3>
              <p>Try adjusting your search or filter</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Work Date</th>
                  <th>Clock In</th>
                  <th>Clock Out</th>
                  <th>Hours</th>
                  <th>Task</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => {
                  const isOwner = t.employee === user?.id;
                  const canEdit = isManagerOrAdmin || isOwner;
                  const isOpen = !t.clock_out; // hasn't been clocked out yet
                  return (
                    <tr key={t.id}>
                      <td>
                        <div className="user-cell">
                          <div className="avatar-sm">
                            {t.employee_detail?.first_name?.[0] ?? 'E'}{t.employee_detail?.last_name?.[0] ?? ''}
                          </div>
                          <div>
                            <div className="user-cell-name">
                              {t.employee_detail
                                ? `${t.employee_detail.first_name} ${t.employee_detail.last_name}`.trim() || t.employee_detail.username
                                : `Employee #${t.employee}`}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="td-primary">{t.work_date}</td>
                      <td>{t.clock_in}</td>
                      <td>{t.clock_out ?? <span style={{ color: 'var(--warning)' }}>Active</span>}</td>
                      <td>
                        <strong style={{ color: 'var(--text-primary)' }}>
                          {t.hours_worked ? parseFloat(t.hours_worked).toFixed(2) : '—'}
                        </strong>
                      </td>
                      <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.task_description || '—'}
                      </td>
                      <td><span className={statusBadge(t.status)}>{t.status}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {/* Clock Out button – only shown for the owner's open entry */}
                          {isOwner && isOpen && (
                            <button
                              className="btn btn-warning btn-xs"
                              onClick={() => setClockOutTarget(t)}
                            >
                              Clock Out
                            </button>
                          )}
                          {/* Edit – for managers/admins on any row, or owner on their own */}
                          {canEdit && (
                            <button
                              className="btn btn-ghost btn-xs"
                              onClick={() => setFormModal({ mode: 'edit', initial: t })}
                            >
                              Edit
                            </button>
                          )}
                          {/* Delete – for managers/admins on any row, or owner on their own */}
                          {canEdit && (
                            <button
                              className="btn btn-danger btn-xs"
                              onClick={() => handleDelete(t.id)}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default TimesheetsPage;
