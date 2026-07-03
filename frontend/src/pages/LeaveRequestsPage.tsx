import { useEffect, useState, useCallback } from 'react';
import Layout from '../components/Layout';
import { getLeaveRequests, createLeaveRequest, updateLeaveRequest, deleteLeaveRequest } from '../api/leaveRequests';
import type { LeaveRequest } from '../types/models';
import { useAuth } from '../context/AuthContext';

/* ─── helpers ─────────────────────────────────────────────────────────────── */
const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    approved: 'badge-success', pending: 'badge-warning', rejected: 'badge-danger',
  };
  return `badge ${map[status] ?? 'badge-neutral'}`;
};

const typeBadge = (type: string) => {
  const map: Record<string, string> = {
    sick: 'badge-danger', vacation: 'badge-info', personal: 'badge-purple',
  };
  return `badge ${map[type] ?? 'badge-neutral'}`;
};

const daysBetween = (start: string, end: string) => {
  const diff = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(1, Math.round(diff / 86400000) + 1);
};

/* ─── Reject Modal ─────────────────────────────────────────────────────────── */
interface RejectModalProps {
  employeeName: string;
  onClose: () => void;
  onConfirm: (notes: string) => Promise<void>;
}
const RejectModal = ({ employeeName, onClose, onConfirm }: RejectModalProps) => {
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) { setErr('A reason for rejection is required.'); return; }
    setSaving(true);
    try {
      await onConfirm(notes);
    } catch {
      setErr('Failed to reject request. Please try again.');
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <div className="modal-header">
          <h3>Reject Leave Request</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 16, fontSize: 14 }}>
          You are rejecting the leave request from <strong>{employeeName}</strong>. A reason is required.
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {err && <div className="error-banner">⚠ {err}</div>}
          <div className="form-group">
            <label>Reason for Rejection <span style={{ color: 'var(--danger)' }}>*</span></label>
            <textarea
              required
              rows={4}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Please provide a clear reason for rejecting this request…"
              style={{ resize: 'vertical', background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-sm)', padding: 10, fontSize: 13, width: '100%', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="btn btn-danger" disabled={saving}>
              {saving ? 'Rejecting…' : 'Confirm Rejection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─── Leave Request Form Modal ─────────────────────────────────────────────── */
interface LeaveFormModalProps {
  initial?: Partial<LeaveRequest>;
  onClose: () => void;
  onSave: (data: Partial<LeaveRequest>) => Promise<void>;
}
const LeaveFormModal = ({ initial, onClose, onSave }: LeaveFormModalProps) => {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    leave_type: initial?.leave_type || 'vacation' as 'sick' | 'vacation' | 'personal',
    start_date: initial?.start_date || today,
    end_date: initial?.end_date || today,
    reason: initial?.reason || '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const isEdit = !!initial?.id;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.reason.trim()) { setErr('Please provide a reason for your leave request.'); return; }
    if (form.end_date < form.start_date) { setErr('End date cannot be before start date.'); return; }
    setSaving(true);
    try {
      await onSave(form);
    } catch (err: any) {
      setErr(err?.response?.data?.detail || 'Failed to save. Please check the details.');
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <h3>{isEdit ? 'Edit Leave Request' : 'New Leave Request'}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {err && <div className="error-banner">⚠ {err}</div>}
          <div className="form-group">
            <label>Leave Type</label>
            <select name="leave_type" value={form.leave_type} onChange={handleChange}
              style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: 13 }}>
              <option value="vacation">Vacation</option>
              <option value="sick">Sick Leave</option>
              <option value="personal">Personal</option>
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label>From</label>
              <input type="date" name="start_date" required value={form.start_date} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>To</label>
              <input type="date" name="end_date" required value={form.end_date} onChange={handleChange} />
            </div>
          </div>
          <div className="form-group">
            <label>Reason <span style={{ color: 'var(--danger)' }}>*</span></label>
            <textarea
              name="reason"
              required
              rows={4}
              value={form.reason}
              onChange={handleChange}
              placeholder="Please explain the reason for your leave request…"
              style={{ resize: 'vertical', background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-sm)', padding: 10, fontSize: 13, width: '100%', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─── Main Page ────────────────────────────────────────────────────────────── */
const LeaveRequestsPage = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setType] = useState('');
  const [statusFilter, setStatus] = useState('');

  // Modals
  const [rejectTarget, setRejectTarget] = useState<LeaveRequest | null>(null);
  const [formModal, setFormModal] = useState<{ mode: 'create' | 'edit'; initial?: Partial<LeaveRequest> } | null>(null);

  const isManagerOrAdmin = user?.role === 'manager' || user?.role === 'admin';

  const fetchRequests = useCallback(() => {
    setLoading(true);
    getLeaveRequests().then(setRequests).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const filtered = requests.filter(r => {
    const q = search.toLowerCase();
    const name = `${r.employee_detail?.first_name ?? ''} ${r.employee_detail?.last_name ?? ''}`.toLowerCase();
    const matchSearch = !q || r.reason?.toLowerCase().includes(q) || r.leave_type.includes(q) || name.includes(q);
    const matchType = !typeFilter || r.leave_type === typeFilter;
    const matchStatus = !statusFilter || r.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  /* ── Approve ── */
  const handleApprove = async (id: number) => {
    try {
      await updateLeaveRequest(id, { status: 'approved' });
      fetchRequests();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to approve.');
    }
  };

  /* ── Reject (opens modal) ── */
  const handleRejectConfirm = async (notes: string) => {
    if (!rejectTarget) return;
    await updateLeaveRequest(rejectTarget.id, { status: 'rejected', manager_notes: notes });
    setRejectTarget(null);
    fetchRequests();
  };

  /* ── Delete ── */
  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this leave request? This cannot be undone.')) return;
    try {
      await deleteLeaveRequest(id);
      fetchRequests();
    } catch {
      alert('Failed to delete.');
    }
  };

  /* ── Create / Edit form save ── */
  const handleFormSave = async (data: Partial<LeaveRequest>) => {
    if (formModal?.mode === 'edit' && formModal.initial?.id) {
      await updateLeaveRequest(formModal.initial.id, data);
    } else {
      await createLeaveRequest(data);
    }
    setFormModal(null);
    fetchRequests();
  };

  if (loading) return (
    <Layout>
      <div className="page-loading"><div className="spinner" /><span>Loading leave requests…</span></div>
    </Layout>
  );

  return (
    <Layout>
      {/* ── Reject Modal ── */}
      {rejectTarget && (
        <RejectModal
          employeeName={
            rejectTarget.employee_detail
              ? `${rejectTarget.employee_detail.first_name} ${rejectTarget.employee_detail.last_name}`.trim()
              : `Employee #${rejectTarget.employee}`
          }
          onClose={() => setRejectTarget(null)}
          onConfirm={handleRejectConfirm}
        />
      )}

      {/* ── Create / Edit Modal ── */}
      {formModal && (
        <LeaveFormModal
          initial={formModal.initial}
          onClose={() => setFormModal(null)}
          onSave={handleFormSave}
        />
      )}

      <div className="page-header">
        <div className="page-header-left">
          <h2>Leave Requests</h2>
          <p>{requests.filter(r => r.status === 'pending').length} pending approval · {requests.length} total</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setFormModal({ mode: 'create' })}>
          + New Request
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {(['pending', 'approved', 'rejected'] as const).map(s => (
          <div key={s} className="stat-card" style={{ padding: 20 }}>
            <div className="stat-value" style={{ fontSize: 28 }}>{requests.filter(r => r.status === s).length}</div>
            <div className="stat-label" style={{ textTransform: 'capitalize' }}>{s}</div>
          </div>
        ))}
        <div className="stat-card blue" style={{ padding: 20 }}>
          <div className="stat-value" style={{ fontSize: 28 }}>{requests.filter(r => r.leave_type === 'sick').length}</div>
          <div className="stat-label">Sick Leave</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">All Leave Requests</span>
          <div className="flex gap-2 items-center" style={{ flexWrap: 'wrap' }}>
            <div className="search-bar">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search reason or name…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: 200 }}
              />
            </div>
            <select
              value={typeFilter}
              onChange={e => setType(e.target.value)}
              style={{ width: 140, padding: '9px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '13px' }}
            >
              <option value="">All Types</option>
              <option value="sick">Sick</option>
              <option value="vacation">Vacation</option>
              <option value="personal">Personal</option>
            </select>
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
              <div className="empty-icon">🗓</div>
              <h3>No leave requests found</h3>
              <p>Try adjusting your search or filters</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Type</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Days</th>
                  <th>Reason</th>
                  <th>Requested</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => {
                  const isOwner = r.employee === user?.id;
                  const canEdit = isOwner && r.status === 'pending';
                  const empName = r.employee_detail
                    ? `${r.employee_detail.first_name} ${r.employee_detail.last_name}`.trim() || r.employee_detail.username
                    : `Employee #${r.employee}`;

                  return (
                    <tr key={r.id}>
                      <td>
                        <div className="user-cell">
                          <div className="avatar-sm alt2">
                            {r.employee_detail?.first_name?.[0] ?? '#'}{r.employee_detail?.last_name?.[0] ?? ''}
                          </div>
                          <div className="user-cell-name">{empName}</div>
                        </div>
                      </td>
                      <td><span className={typeBadge(r.leave_type)}>{r.leave_type}</span></td>
                      <td className="td-primary">{r.start_date}</td>
                      <td>{r.end_date}</td>
                      <td>
                        <strong style={{ color: 'var(--text-primary)' }}>{daysBetween(r.start_date, r.end_date)}d</strong>
                      </td>
                      <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.reason || '—'}
                      </td>
                      <td className="text-muted text-sm">{new Date(r.requested_at).toLocaleDateString()}</td>
                      <td>
                        <div>
                          <span className={statusBadge(r.status)}>{r.status}</span>
                          {r.manager_notes && r.status === 'rejected' && (
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }} title={r.manager_notes}>
                              📝 {r.manager_notes.slice(0, 40)}{r.manager_notes.length > 40 ? '…' : ''}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {/* Edit – only the owner on a pending request */}
                          {canEdit && (
                            <button
                              className="btn btn-ghost btn-xs"
                              onClick={() => setFormModal({ mode: 'edit', initial: r })}
                            >
                              Edit
                            </button>
                          )}
                          {/* Delete – owner (any status) or admin/manager */}
                          {(isOwner || isManagerOrAdmin) && (
                            <button
                              className="btn btn-danger btn-xs"
                              onClick={() => handleDelete(r.id)}
                            >
                              Delete
                            </button>
                          )}
                          {/* Approve / Reject – managers/admins only on pending items */}
                          {isManagerOrAdmin && r.status === 'pending' && (
                            <>
                              <button
                                className="btn btn-success btn-xs"
                                onClick={() => handleApprove(r.id)}
                              >
                                ✓ Approve
                              </button>
                              <button
                                className="btn btn-warning btn-xs"
                                onClick={() => setRejectTarget(r)}
                              >
                                ✕ Reject
                              </button>
                            </>
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

export default LeaveRequestsPage;
