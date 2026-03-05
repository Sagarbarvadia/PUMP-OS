import React, { useEffect, useState } from 'react';
import { authAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Pencil, Trash2, X, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { Navigate } from 'react-router-dom';

const ROLES = ['ADMIN', 'PRODUCTION_MANAGER', 'STORE_MANAGER', 'ACCOUNTANT'];
const EMPTY = { username: '', email: '', first_name: '', last_name: '', role: 'STORE_MANAGER', password: '', is_active: true };

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-md shadow-xl w-full max-w-md border border-slate-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 className="font-heading font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

const ROLE_COLORS = {
  ADMIN: 'badge-error',
  PRODUCTION_MANAGER: 'badge-warning',
  STORE_MANAGER: 'badge-info',
  ACCOUNTANT: 'badge-neutral',
};

export default function Users() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const fetchUsers = () => authAPI.users().then(r => { setUsers(r.data); setLoading(false); });
  useEffect(() => { if (me?.role === 'ADMIN') fetchUsers(); }, [me?.role]);

  if (me?.role !== 'ADMIN') return <Navigate to="/dashboard" />;

  const openCreate = () => { setForm(EMPTY); setEditUser(null); setModalOpen(true); };
  const openEdit = u => { setForm({ ...u, password: '' }); setEditUser(u); setModalOpen(true); };

  const handleSave = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { ...form };
      if (editUser && !data.password) delete data.password;
      editUser ? await authAPI.updateUser(editUser.id, data) : await authAPI.createUser(data);
      toast.success(editUser ? 'User updated' : 'User created');
      setModalOpen(false);
      fetchUsers();
    } catch (err) {
      const errMsg = err.response?.data;
      toast.error(typeof errMsg === 'string' ? errMsg : errMsg?.username?.[0] || errMsg?.email?.[0] || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async u => {
    if (u.id === me.id) { toast.error("Can't delete your own account"); return; }
    if (!window.confirm(`Delete user "${u.username}"?`)) return;
    try {
      await authAPI.deleteUser(u.id);
      toast.success('User deleted');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Cannot delete');
    }
  };

  return (
    <div className="space-y-4 animate-fade-in" data-testid="users-page">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Shield size={15} className="text-orange-500" />
          <span>Admin only — manage system users and roles</span>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 h-9 px-4 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-md" data-testid="add-user-btn">
          <Plus size={15} /> Add User
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-md shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="table-scroll">
            <table className="data-table w-full" data-testid="users-table">
              <thead>
                <tr><th>Username</th><th>Full Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th className="text-right">Actions</th></tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td className="font-semibold font-mono text-sm">
                      {u.username}
                      {u.id === me.id && <span className="ml-2 text-xs text-orange-500">(you)</span>}
                    </td>
                    <td>{u.first_name} {u.last_name}</td>
                    <td className="text-slate-500 text-sm">{u.email}</td>
                    <td><span className={ROLE_COLORS[u.role] || 'badge-neutral'}>{u.role.replace('_', ' ')}</span></td>
                    <td><span className={u.is_active ? 'badge-success' : 'badge-neutral'}>{u.is_active ? 'Active' : 'Inactive'}</span></td>
                    <td className="font-mono text-xs text-slate-400">{new Date(u.date_joined).toLocaleDateString()}</td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(u)} className="text-slate-400 hover:text-blue-600" data-testid={`edit-user-${u.id}`}><Pencil size={14} /></button>
                        {u.id !== me.id && <button onClick={() => handleDelete(u)} className="text-slate-400 hover:text-red-600" data-testid={`del-user-${u.id}`}><Trash2 size={14} /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <Modal title={editUser ? `Edit: ${editUser.username}` : 'New User'} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-overline block mb-1">Username *</label>
                <input required className="w-full h-9 px-3 border border-slate-300 rounded-md text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} data-testid="user-form-username" />
              </div>
              <div>
                <label className="label-overline block mb-1">Role</label>
                <select className="w-full h-9 px-3 border border-slate-300 rounded-md text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                  {ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-overline block mb-1">First Name</label>
                <input className="w-full h-9 px-3 border border-slate-300 rounded-md text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500" value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} />
              </div>
              <div>
                <label className="label-overline block mb-1">Last Name</label>
                <input className="w-full h-9 px-3 border border-slate-300 rounded-md text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500" value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label-overline block mb-1">Email *</label>
              <input type="email" required className="w-full h-9 px-3 border border-slate-300 rounded-md text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} data-testid="user-form-email" />
            </div>
            <div>
              <label className="label-overline block mb-1">{editUser ? 'New Password (leave blank to keep)' : 'Password *'}</label>
              <input type="password" required={!editUser} minLength={6} className="w-full h-9 px-3 border border-slate-300 rounded-md text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} data-testid="user-form-password" />
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="user-active" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 accent-orange-600" />
              <label htmlFor="user-active" className="text-sm font-medium text-slate-700">Active account</label>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="flex-1 h-10 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white text-sm font-medium rounded-md" data-testid="user-save-btn">
                {saving ? 'Saving...' : editUser ? 'Update User' : 'Create User'}
              </button>
              <button type="button" onClick={() => setModalOpen(false)} className="h-10 px-4 border border-slate-300 text-sm rounded-md hover:bg-slate-50">Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
