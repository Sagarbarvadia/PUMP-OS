import React, { useEffect, useState } from 'react';
import { masterAPI, productionAPI } from '@/services/api';
import { Plus, Pencil, Trash2, X, Search, AlertCircle, Upload, FileDown, CheckCircle2, AlertTriangle,ChevronRight, Info } from 'lucide-react';
import { toast } from 'sonner';


function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 px-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-md shadow-xl w-full max-w-lg border border-slate-200 my-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 className="font-heading font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function StatusBadge({ s }) {
  const map = { PLANNED: 'badge-info', IN_PROGRESS: 'badge-warning', COMPLETED: 'badge-success', CANCELLED: 'badge-neutral' };
  return <span className={map[s] || 'badge-neutral'}>{s}</span>;
}

const today = new Date().toISOString().slice(0, 10);
const EMPTY = { order_no: '', date: today, product_model: '', qty_planned: '', qty_produced: '', qty_rejected: '0', batch_no: '', notes: '' };

export default function Production() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOrder, setDetailOrder] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  

  const fetchAll = () => {
    Promise.all([productionAPI.orders(), masterAPI.products({ status: 'true' })]).then(([o, p]) => {
      setOrders(o.data);
      setProducts(p.data);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  };
  useEffect(() => { fetchAll(); }, []);

  const openDetail = async id => {
    const r = await productionAPI.getOrder(id);
    setDetailOrder(r.data);
  };

  const handleSave = async (e) => {
  e.preventDefault();
  setSaving(true);

  try {

    const payload = {
      ...form,
      qty_planned: Number(form.qty_planned || 0),
      qty_produced: Number(form.qty_produced || 0),
      qty_rejected: Number(form.qty_rejected || 0)
    };

    if (editingId) {

      await productionAPI.updateOrder(editingId, payload);
      toast.success("Production order updated ✅");

    } else {

      await productionAPI.createOrder(payload);
      toast.success("Production order created ✅");

    }

    setModalOpen(false);
    setEditingId(null);
    setForm(EMPTY);
    fetchAll();

  } catch (err) {

    console.log("SAVE ERROR:", err.response);

    const msg =
      err.response?.data?.error ||
      err.response?.data?.detail ||
      JSON.stringify(err.response?.data) ||
      "Save failed";

  toast.error(msg);

  } finally {

    setSaving(false);

  }
};
  const handleEdit = (row) => {

    setEditingId(row.id);
    setForm(row);
    setModalOpen(true);

  };
 const handleDelete = async (id) => {

  if (!window.confirm("Delete this order?")) return;

  try {

    await productionAPI.deleteOrder(id);

    toast.success("Order deleted");

    fetchAll(); // refresh table

  } catch (error) {

    console.error("Delete error:", error.response?.data || error.message);

    toast.error("Delete failed");

  }

};
};

  const statsProduced = orders.filter(o => o.status === 'COMPLETED').reduce((s, o) => s + Number(o.qty_produced), 0);
  const statsRejected = orders.filter(o => o.status === 'COMPLETED').reduce((s, o) => s + Number(o.qty_rejected), 0);

  return (
    <div className="space-y-4 animate-fade-in" data-testid="production-page">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card text-center py-3">
          <p className="label-overline">Total Orders</p>
          <p className="font-heading font-black text-2xl font-mono">{orders.length}</p>
        </div>
        <div className="stat-card text-center py-3">
          <p className="label-overline">Total Produced</p>
          <p className="font-heading font-black text-2xl text-emerald-600 font-mono">{statsProduced.toFixed(0)}</p>
        </div>
        <div className="stat-card text-center py-3">
          <p className="label-overline">Total Rejected</p>
          <p className="font-heading font-black text-2xl text-red-500 font-mono">{statsRejected.toFixed(0)}</p>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => {
              setEditingId(null);
              setForm(EMPTY);
              setModalOpen(true);
            }}
          className="flex items-center gap-2 h-9 px-4 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-md"
          data-testid="add-production-btn"
        >
          <Plus size={15} /> New Production Order
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-md shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="table-scroll">
            <table className="data-table w-full" data-testid="production-table">
              <thead>
                <tr>
                  <th>Order No</th><th>Date</th><th>Model</th><th>Batch</th>
                  <th className="text-right">Planned</th><th className="text-right">Produced</th>
                  <th className="text-right">Rejected</th><th className="text-right">Net</th>
                  <th className="text-right">Batch Cost</th><th>Status</th><th></th>
                </tr>
              </thead>
              <tbody>
                  {orders.length === 0 ? (
                  <tr>
                  <td colSpan={11} className="text-center py-10 text-slate-400">
                  No production orders yet
                  </td>
                  </tr>
                  ) : orders.map(o => (
                  <tr key={o.id}>
                  <td className="font-mono text-xs font-semibold text-orange-600">{o.order_no}</td>
                  <td className="font-mono text-xs">{o.date}</td>
                  <td className="font-medium">{o.model_name}</td>
                  <td className="font-mono text-xs text-slate-500">{o.batch_no}</td>
                  <td className="text-right font-mono">{Number(o.qty_planned).toFixed(0)}</td>
                  <td className="text-right font-mono text-emerald-600">{Number(o.qty_produced).toFixed(0)}</td>
                  <td className="text-right font-mono text-red-500">{Number(o.qty_rejected).toFixed(0)}</td>
                  <td className="text-right font-mono font-bold">{Number(o.net_produced).toFixed(0)}</td>
                  <td className="text-right font-mono text-slate-700">₹{Number(o.batch_cost).toFixed(2)}</td>
                  <td><StatusBadge s={o.status} /></td>

                  <td>
                  <button
                  onClick={() => openDetail(o.id)}
                  className="text-slate-400 hover:text-blue-600 p-1"
                  >
                  <ChevronRight size={14} />
                  </button>
                  </td>

                  <td className="flex gap-2">

                  <button
                                        onClick={() => handleEdit(o)}
                                        className="text-slate-400 hover:text-blue-600"
                                      ><Pencil size={14} />
                                        
                                      </button>
                  
                                      <button
                                        onClick={() => handleDelete(o.id)}
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

      {/* New order modal */}
      {modalOpen && (
        <Modal
          title={editingId ? "Edit Production Order" : "New Production Order"}
          onClose={() => setModalOpen(false)}
            >
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-overline block mb-1">Date *</label>
                <input type="date" required className="w-full h-9 px-3 border border-slate-300 rounded-md text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} data-testid="prod-date" />
              </div>
              <div>
                <label className="label-overline block mb-1">Batch No</label>
                <input className="w-full h-9 px-3 border border-slate-300 rounded-md text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono" value={form.batch_no} onChange={e => setForm({ ...form, batch_no: e.target.value })} placeholder="Auto-generated" data-testid="prod-batch" />
              </div>
            </div>
            <div>
              <label className="label-overline block mb-1">Product Model *</label>
              <select required className="w-full h-9 px-3 border border-slate-300 rounded-md text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500" value={form.product_model} onChange={e => setForm({ ...form, product_model: e.target.value })} data-testid="prod-model">
                <option value="">— Select model —</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.model_id} — {p.model_name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label-overline block mb-1">Qty Planned</label>
                <input type="number" step="1" min="0" className="w-full h-9 px-3 border border-slate-300 rounded-md text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono" value={form.qty_planned} onChange={e => setForm({ ...form, qty_planned: e.target.value })} data-testid="prod-qty-planned" />
              </div>
              <div>
                <label className="label-overline block mb-1">Qty Produced *</label>
                <input type="number" step="1" min="1" required className="w-full h-9 px-3 border border-slate-300 rounded-md text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono" value={form.qty_produced} onChange={e => setForm({ ...form, qty_produced: e.target.value })} data-testid="prod-qty-produced" />
              </div>
              <div>
                <label className="label-overline block mb-1">Qty Rejected</label>
                <input type="number" step="1" min="0" className="w-full h-9 px-3 border border-slate-300 rounded-md text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono" value={form.qty_rejected} onChange={e => setForm({ ...form, qty_rejected: e.target.value })} data-testid="prod-qty-rejected" />
              </div>
            </div>
            <div>
              <label className="label-overline block mb-1">Notes</label>
              <textarea rows={2} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-md px-4 py-2.5 flex items-start gap-2 text-xs text-amber-700">
              <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
              Raw materials will be deducted from stock based on active BOM. Ensure sufficient stock before submitting.
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="flex-1 h-10 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white text-sm font-medium rounded-md" data-testid="prod-save-btn">
                {saving ? 'Processing...' : 'Process Production'}
              </button>
              <button type="button" onClick={() => setModalOpen(false)} className="h-10 px-4 border border-slate-300 text-sm rounded-md hover:bg-slate-50">Cancel</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Order Detail Modal */}
      {detailOrder && (
        <Modal title={`Order: ${detailOrder.order_no}`} onClose={() => setDetailOrder(null)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="label-overline">Model</span><p className="font-medium mt-0.5">{detailOrder.model_name}</p></div>
              <div><span className="label-overline">Date</span><p className="font-mono mt-0.5">{detailOrder.date}</p></div>
              <div><span className="label-overline">Produced</span><p className="font-mono font-bold text-emerald-600 mt-0.5">{detailOrder.qty_produced}</p></div>
              <div><span className="label-overline">Rejected</span><p className="font-mono font-bold text-red-500 mt-0.5">{detailOrder.qty_rejected}</p></div>
              <div><span className="label-overline">Batch Cost</span><p className="font-mono font-bold text-orange-600 mt-0.5">₹{Number(detailOrder.batch_cost).toFixed(2)}</p></div>
              <div><span className="label-overline">Cost/Unit</span><p className="font-mono font-bold mt-0.5">₹{Number(detailOrder.cost_per_unit).toFixed(4)}</p></div>
            </div>
            <div>
              <p className="font-heading font-semibold text-sm text-slate-700 mb-2">Material Usage</p>
              <div className="table-scroll">
                <table className="data-table w-full text-xs">
                  <thead><tr><th>Item</th><th className="text-right">Qty Used</th><th className="text-right">Rate</th><th className="text-right">Cost</th></tr></thead>
                  <tbody>
                    {detailOrder.material_usage?.map(u => (
                      <tr key={u.id}>
                        <td>{u.item_name}</td>
                        <td className="text-right font-mono">{Number(u.qty_used).toFixed(4)} {u.unit}</td>
                        <td className="text-right font-mono">₹{Number(u.rate).toFixed(4)}</td>
                        <td className="text-right font-mono font-semibold">₹{Number(u.cost).toFixed(4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
