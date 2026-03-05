import React, { useEffect, useState } from 'react';
import { masterAPI, inventoryAPI } from '@/services/api';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, X, Search, AlertCircle, Upload, FileDown, CheckCircle2, AlertTriangle, Info } from 'lucide-react';


function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-md shadow-xl w-full max-w-lg border border-slate-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 className="font-heading font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

const today = new Date().toISOString().slice(0, 10);
const EMPTY = { purchase_date: today, supplier_name: '', raw_material: '', quantity: '', purchase_rate: '', notes: '' };

export default function Purchase() {
  
  const [purchases, setPurchases] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const fetchAll = () => {
    Promise.all([
      inventoryAPI.purchases(),
      masterAPI.rawMaterials({ status: 'true' })
    ]).then(([p, m]) => {
      setPurchases(p.data);
      setMaterials(m.data);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  };
  useEffect(() => { fetchAll(); }, []);

  const totalAmount = () => {
    const q = parseFloat(form.quantity) || 0;
    const r = parseFloat(form.purchase_rate) || 0;
    return (q * r).toFixed(4);
  };
  const handleDelete = async (id) => {

    if (!window.confirm("Delete this purchase entry? Stock will be adjusted.")) return;

    try {
      await inventoryAPI.deletePurchase(id);
      toast.success("Purchase deleted");
      fetchAll();
    } catch (err) {
      toast.error("Delete failed");
    }

  };

  const handleEdit = (purchase) => {
  setEditingId(purchase.id);

    setForm({
      purchase_date: purchase.purchase_date,
      supplier_name: purchase.supplier_name,
      raw_material: purchase.raw_material,
      quantity: purchase.quantity,
      purchase_rate: purchase.purchase_rate,
      notes: purchase.notes || ''
    });

    setModalOpen(true);
  };

  const handleSave = async e => {
  e.preventDefault();

  if (!form.raw_material) {
    toast.error("Select a raw material");
    return;
  }

  setSaving(true);

  try {

    if (editingId) {
      await inventoryAPI.updatePurchase(editingId, {
        ...form,
        total_amount: parseFloat(totalAmount())
      });

      toast.success("Purchase updated");

    } else {

      await inventoryAPI.createPurchase({
        ...form,
        total_amount: parseFloat(totalAmount())
      });

      toast.success("Purchase recorded — stock updated");
    }

    setModalOpen(false);
    setForm(EMPTY);
    setEditingId(null);
    fetchAll();

  } catch (err) {

    toast.error(
      err.response?.data?.error ||
      err.response?.data?.detail ||
      "Failed to save"
    );

  } finally {
    setSaving(false);
  }
};

  return (
    <div className="space-y-4 animate-fade-in" data-testid="purchase-page">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{purchases.length} entries</p>
        <button
          onClick={() => { setForm(EMPTY); setModalOpen(true); }}
          className="flex items-center gap-2 h-9 px-4 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-md"
          data-testid="add-purchase-btn"
        >
          <Plus size={15} /> New Purchase
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-md shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="table-scroll">
            <table className="data-table w-full" data-testid="purchases-table">
              <thead>
                <tr>
                  <th>Date</th><th>Supplier</th><th>Item</th><th>Unit</th>
                  <th className="text-right w-20">Qty</th><th className="text-right w-20">Rate</th>
                  <th className="text-right w-20 ">Amount</th>
                  <th>By</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {purchases.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-10 text-slate-400">No purchases recorded yet</td></tr>
                ) : purchases.map(p => (
                  <tr key={p.id}>
                    <td className="font-mono text-xs">{p.purchase_date}</td>
                    <td className="font-medium">{p.supplier_name}</td>
                    <td className="text-slate-700">{p.item_name}</td>
                    <td className="text-xs font-mono">{p.item_unit}</td>
                    <td className="text-right font-mono">{Number(p.quantity).toFixed(4)}</td>
                    <td className="text-right font-mono">₹{Number(p.purchase_rate).toFixed(4)}</td>
                    <td className="text-right font-mono font-semibold text-slate-900">₹{Number(p.total_amount).toFixed(2)}</td>
                    <td className="text-xs text-slate-400">{p.created_by_name}</td>
                    <td className="flex gap-2">
                    <button
                      onClick={() => handleEdit(p)}
                      className="text-slate-400 hover:text-blue-600"
                    ><Pencil size={14} />
                      
                    </button>

                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-slate-400 hover:text-blue-600"
                    >
                      <Trash2 size={14} />
                      
                    </button>
                  </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <Modal title="New Purchase Entry" onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-overline block mb-1">Purchase Date *</label>
                <input type="date" required className="w-full h-9 px-3 border border-slate-300 rounded-md text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500" value={form.purchase_date} onChange={e => setForm({ ...form, purchase_date: e.target.value })} data-testid="pur-date" />
              </div>
              <div>
                <label className="label-overline block mb-1">Supplier Name *</label>
                <input required className="w-full h-9 px-3 border border-slate-300 rounded-md text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500" value={form.supplier_name} onChange={e => setForm({ ...form, supplier_name: e.target.value })} data-testid="pur-supplier" />
              </div>
            </div>
            <div>
              <label className="label-overline block mb-1">Raw Material *</label>
              <select required className="w-full h-9 px-3 border border-slate-300 rounded-md text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500" value={form.raw_material} onChange={e => setForm({ ...form, raw_material: e.target.value })} data-testid="pur-material">
                <option value="">— Select item —</option>
                {materials.map(m => <option key={m.id} value={m.id}>{m.item_id} — {m.item_name} ({m.unit})</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-overline block mb-1">Quantity *</label>
                <input type="number" step="0.0001" min="0.0001" required className="w-full h-9 px-3 border border-slate-300 rounded-md text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} data-testid="pur-qty" />
              </div>
              <div>
                <label className="label-overline block mb-1">Purchase Rate (₹) *</label>
                <input type="number" step="0.0001" min="0.0001" required className="w-full h-9 px-3 border border-slate-300 rounded-md text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono" value={form.purchase_rate} onChange={e => setForm({ ...form, purchase_rate: e.target.value })} data-testid="pur-rate" />
              </div>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-md px-4 py-3 flex items-center justify-between">
              <span className="label-overline">Total Amount</span>
              <span className="font-mono font-black text-xl text-orange-600">₹{totalAmount()}</span>
            </div>
            <div>
              <label className="label-overline block mb-1">Notes</label>
              <textarea rows={2} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="flex-1 h-10 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white text-sm font-medium rounded-md" data-testid="pur-save-btn">
                {saving ? 'Processing...' : 'Save Purchase'}
              </button>
              <button type="button" onClick={() => setModalOpen(false)} className="h-10 px-4 border border-slate-300 text-sm rounded-md hover:bg-slate-50">Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
