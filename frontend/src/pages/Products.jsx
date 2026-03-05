import React, { useEffect, useState } from 'react';
import { masterAPI } from '@/services/api';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

const EMPTY = { model_id: '', model_name: '', brand: '', description: '', status: true };

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

export default function Products() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const fetchItems = () => masterAPI.products().then(r => { setItems(r.data); setLoading(false); });
  useEffect(() => { fetchItems(); }, []);

  const openCreate = () => { setForm(EMPTY); setEditItem(null); setModalOpen(true); };
  const openEdit = item => { setForm({ ...item }); setEditItem(item); setModalOpen(true); };

  const handleSave = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      editItem ? await masterAPI.updateProduct(editItem.id, form) : await masterAPI.createProduct(form);
      toast.success(editItem ? 'Product model updated' : 'Product model created');
      setModalOpen(false);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.model_id?.[0] || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async item => {
    if (!window.confirm(`Delete "${item.model_name}"?`)) return;
    try {
      await masterAPI.deleteProduct(item.id);
      toast.success('Deleted');
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Cannot delete');
    }
  };

  return (
    <div className="space-y-4 animate-fade-in" data-testid="products-page">
      <div className="flex justify-end">
        <button onClick={openCreate} className="flex items-center gap-2 h-9 px-4 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-md transition-colors" data-testid="add-product-btn">
          <Plus size={15} /> Add Model
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-md shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table w-full" data-testid="products-table">
              <thead>
                <tr>
                  <th>Model ID</th><th>Model Name</th><th>Brand</th>
                  <th className="text-right">Mfg Cost</th><th>BOM</th><th>Status</th><th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-10 text-slate-400">No product models yet</td></tr>
                ) : items.map(item => (
                  <tr key={item.id}>
                    <td className="font-mono text-xs text-slate-500">{item.model_id}</td>
                    <td className="font-semibold text-slate-900">{item.model_name}</td>
                    <td className="text-slate-600">{item.brand || '—'}</td>
                    <td className="font-mono font-semibold text-slate-900">₹{Number(item.manufacturing_cost).toFixed(4)}</td>
                    <td>
                      <span className={item.has_bom ? 'badge-success' : 'badge-warning'}>
                        {item.has_bom ? 'BOM Ready' : 'No BOM'}
                      </span>
                    </td>
                    <td><span className={item.status ? 'badge-success' : 'badge-neutral'}>{item.status ? 'Active' : 'Inactive'}</span></td>
                    <td className="text-slate-600 ">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(item)} className="text-slate-400 hover:text-blue-600" data-testid={`edit-prod-${item.id}`}><Pencil size={14} /></button>
                        <button onClick={() => handleDelete(item)} className="text-slate-400 hover:text-red-600" data-testid={`del-prod-${item.id}`}><Trash2 size={14} /></button>
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
        <Modal title={editItem ? 'Edit Product Model' : 'Add Product Model'} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-overline block mb-1">Model ID *</label>
                <input required className="w-full h-9 px-3 border border-slate-300 rounded-md text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500" value={form.model_id} onChange={e => setForm({ ...form, model_id: e.target.value })} data-testid="prod-form-model-id" />
              </div>
              <div>
                <label className="label-overline block mb-1">Brand</label>
                <input className="w-full h-9 px-3 border border-slate-300 rounded-md text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500" value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label-overline block mb-1">Model Name *</label>
              <input required className="w-full h-9 px-3 border border-slate-300 rounded-md text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500" value={form.model_name} onChange={e => setForm({ ...form, model_name: e.target.value })} data-testid="prod-form-name" />
            </div>
            <div>
              <label className="label-overline block mb-1">Description</label>
              <textarea rows={2} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="prod-status" checked={form.status} onChange={e => setForm({ ...form, status: e.target.checked })} className="w-4 h-4 accent-orange-600" />
              <label htmlFor="prod-status" className="text-sm font-medium text-slate-700">Active</label>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="flex-1 h-10 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white text-sm font-medium rounded-md" data-testid="prod-save-btn">
                {saving ? 'Saving...' : editItem ? 'Update' : 'Create'}
              </button>
              <button type="button" onClick={() => setModalOpen(false)} className="h-10 px-4 border border-slate-300 text-sm rounded-md hover:bg-slate-50">Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
