import React, { useEffect, useState } from 'react';
import { masterAPI, inventoryAPI } from '@/services/api';
import { Plus, X, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { ArrowUpDown } from "lucide-react";

const TABS = ['Raw Material Stock', 'Finished Goods', 'Adjustments', 'Stock Ledger'];

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

export default function Inventory() {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [tab, setTab] = useState(0);
  const [stock, setStock] = useState([]);
  const [fg, setFg] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [ledgerItem, setLedgerItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adjModal, setAdjModal] = useState(false);
  const [adjForm, setAdjForm] = useState({ raw_material: '', adjustment_type: 'ADD', quantity: '', reason: '' });
  const [saving, setSaving] = useState(false);

  const fetchAll = () => {
    setLoading(true);
    Promise.all([inventoryAPI.stock(), inventoryAPI.finishedGoods(), inventoryAPI.adjustments()])
      .then(([s, f, a]) => { setStock(s.data); setFg(f.data); setAdjustments(a.data); setLoading(false); })
      .catch(() => setLoading(false));
  };
  useEffect(() => { fetchAll(); }, []);

  const openLedger = async item => {
    setLedgerItem(item);
    setTab(3);
    const r = await inventoryAPI.ledger(item.id);
    setLedger(r.data);
  };

  const handleAdjSave = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      await inventoryAPI.createAdjustment(adjForm);
      toast.success('Adjustment saved');
      setAdjModal(false);
      setAdjForm({ raw_material: '', adjustment_type: 'ADD', quantity: '', reason: '' });
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Adjustment failed');
    } finally {
      setSaving(false);
    }
  };
  const handleSort = (key) => {

    let dir = "asc";

    if (sortKey === key && sortDir === "asc") {
      dir = "desc";
    }

    setSortKey(key);
    setSortDir(dir);

  };

  const totalRMValue = stock.reduce((s, i) => s + (Number(i.current_stock) * Number(i.moving_avg_cost || 0)), 0);
  const filteredStock = stock
  .filter(i =>
    i.item_id.toLowerCase().includes(search.toLowerCase()) ||
    i.item_name.toLowerCase().includes(search.toLowerCase()) ||
    i.category.toLowerCase().includes(search.toLowerCase())
  )
  .sort((a, b) => {

    if (!sortKey) return 0;

    let valA = a[sortKey];
    let valB = b[sortKey];

    if (sortKey === "value") {
      valA = Number(a.current_stock) * Number(a.moving_avg_cost);
      valB = Number(b.current_stock) * Number(b.moving_avg_cost);
    }

    if (typeof valA === "string") {
      return sortDir === "asc"
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    }

    return sortDir === "asc" ? valA - valB : valB - valA;

  });

  return (
    <div className="space-y-4 animate-fade-in" data-testid="inventory-page">
      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-slate-200 rounded-md p-1 shadow-sm">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`flex-1 h-8 rounded text-xs font-medium transition-colors ${tab === i ? 'bg-orange-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            data-testid={`inventory-tab-${i}`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <>
          {tab === 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-slate-500 ">Total Stock Value: <strong className="font-mono text-orange-600">₹{totalRMValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</strong></p>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
  
                  <input
                    type="text"
                    placeholder="Search item..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
              </div>
              <div className="bg-white border border-slate-200 rounded-md shadow-sm">
                <div className="table-scroll">
                  <table className="data-table w-full" data-testid="rm-stock-table">
                    <thead>
                     <tr>
                      <th onClick={() => handleSort("item_id")} className="cursor-pointer text-center">
                        <div className="flex items-center justify-center gap-1">
                          Item ID <ArrowUpDown size={14} />
                        </div>
                      </th>

                      <th onClick={() => handleSort("item_name")} className="cursor-pointer text-center">
                        <div className="flex items-center justify-center gap-1">
                          Item Name <ArrowUpDown size={14} />
                        </div>
                      </th>

                      <th onClick={() => handleSort("category")} className="cursor-pointer text-center">
                        <div className="flex items-center justify-center gap-1">
                          Cat <ArrowUpDown size={14} />
                        </div>
                      </th>

                      <th className="text-center">Unit</th>

                      <th onClick={() => handleSort("current_stock")} className="cursor-pointer text-center">
                        <div className="flex items-center justify-center gap-1">
                          Stock <ArrowUpDown size={14} />
                        </div>
                      </th>

                      <th onClick={() => handleSort("moving_avg_cost")} className="cursor-pointer text-center">
                        <div className="flex items-center justify-center gap-1">
                          Avg Cost <ArrowUpDown size={14} />
                        </div>
                      </th>

                      <th onClick={() => handleSort("value")} className="cursor-pointer text-center">
                        <div className="flex items-center justify-center gap-1">
                          Value <ArrowUpDown size={14} />
                        </div>
                      </th>

                      <th onClick={() => handleSort("status")} className="cursor-pointer text-center">
                        <div className="flex items-center justify-center gap-1">
                          Status <ArrowUpDown size={14} />
                        </div>
                      </th>

                      <th></th>
                    </tr>
                    </thead>
                    <tbody>
                      {filteredStock.map(i => (
                        <tr key={i.id}>
                          <td className="font-mono text-xs text-slate-500">{i.item_id}</td>
                          <td className="font-medium">{i.item_name}</td>
                          <td className="text-xs">{i.category}</td>
                          <td className="font-mono text-xs">{i.unit}</td>
                          <td className={`text-right font-mono font-semibold ${i.is_below_reorder ? 'text-red-600' : ''}`}>{Number(i.current_stock).toFixed(4)}</td>
                          <td className="text-right font-mono text-xs">₹{Number(i.moving_avg_cost).toFixed(4)}</td>
                          <td className="text-right font-mono text-xs">₹{(Number(i.current_stock) * Number(i.moving_avg_cost)).toFixed(2)}</td>
                          <td><span className={i.is_below_reorder ? 'badge-error' : 'badge-success'}>{i.is_below_reorder ? 'Low' : 'OK'}</span></td>
                          <td>
                            <button onClick={() => openLedger(i)} className="text-slate-400 hover:text-blue-600" title="View Ledger">
                              <BookOpen size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {tab === 1 && (
            <div className="bg-white border border-slate-200 rounded-md shadow-sm">
              <div className="table-scroll">
                <table className="data-table w-full" data-testid="fg-stock-table">
                  <thead><tr><th>Model ID</th><th>Model Name</th><th className="text-right">Finished Goods</th><th className="text-right">Scrap</th></tr></thead>
                  <tbody>
                    {fg.length === 0 ? <tr><td colSpan={4} className="text-center py-8 text-slate-400">No finished goods data</td></tr>
                      : fg.map(f => (
                        <tr key={f.product_model}>
                          <td className="font-mono text-xs text-slate-500">{f.model_id}</td>
                          <td className="font-medium">{f.model_name}</td>
                          <td className="text-right font-mono font-semibold text-emerald-600">{Number(f.finished_goods).toFixed(0)}</td>
                          <td className="text-right font-mono text-red-500">{Number(f.scrap).toFixed(0)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 2 && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <button onClick={() => setAdjModal(true)} className="flex items-center gap-2 h-9 px-4 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-md" data-testid="add-adjustment-btn">
                  <Plus size={15} /> New Adjustment
                </button>
              </div>
              <div className="bg-white border border-slate-200 rounded-md shadow-sm">
                <div className="table-scroll">
                  <table className="data-table w-full" data-testid="adjustments-table">
                    <thead><tr><th>Date</th><th>Item</th><th>Type</th><th className="text-right">Qty</th><th>Reason</th><th>By</th></tr></thead>
                    <tbody>
                      {adjustments.length === 0
                        ? <tr><td colSpan={6} className="text-center py-8 text-slate-400">No adjustments</td></tr>
                        : adjustments.map(a => (
                          <tr key={a.id}>
                            <td className="font-mono text-xs">{new Date(a.created_at).toLocaleDateString()}</td>
                            <td>{a.item_name}</td>
                            <td><span className={a.adjustment_type === 'ADD' ? 'badge-success' : 'badge-error'}>{a.adjustment_type}</span></td>
                            <td className="text-right font-mono">{Number(a.quantity).toFixed(4)}</td>
                            <td className="text-slate-500 text-xs max-w-xs truncate">{a.reason}</td>
                            <td className="text-xs text-slate-400">{a.created_by_name}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {tab === 3 && (
            <div className="space-y-3">
              {ledgerItem && (
                <div className="bg-blue-50 border border-blue-200 rounded-md px-4 py-2 text-sm">
                  Showing ledger for: <strong>{ledgerItem.item_name}</strong> ({ledgerItem.item_id})
                  <button onClick={() => { setLedgerItem(null); setLedger([]); }} className="ml-2 text-blue-500 hover:text-blue-700 underline text-xs">Clear</button>
                </div>
              )}
              {!ledgerItem && <p className="text-sm text-slate-400">Select an item from the "Raw Material Stock" tab to view its ledger</p>}
              {ledger.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-md shadow-sm">
                  <div className="table-scroll">
                    <table className="data-table w-full" data-testid="ledger-table">
                      <thead><tr><th>Date</th><th>Type</th><th className="text-right">Qty</th><th className="text-right">Rate</th><th className="text-right">Balance</th><th>Reference</th></tr></thead>
                      <tbody>
                        {ledger.map(l => (
                          <tr key={l.id}>
                            <td className="font-mono text-xs">{new Date(l.created_at).toLocaleDateString()}</td>
                            <td><span className={l.transaction_type === 'PURCHASE' ? 'badge-info' : l.transaction_type === 'PRODUCTION' ? 'badge-warning' : 'badge-neutral'}>{l.transaction_type}</span></td>
                            <td className={`text-right font-mono ${Number(l.quantity) < 0 ? 'text-red-600' : 'text-emerald-600'}`}>{Number(l.quantity).toFixed(4)}</td>
                            <td className="text-right font-mono text-xs">₹{Number(l.rate).toFixed(4)}</td>
                            <td className="text-right font-mono font-semibold">{Number(l.balance_qty).toFixed(4)}</td>
                            <td className="text-xs text-slate-400">{l.reference_no}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {adjModal && (
        <Modal title="Manual Stock Adjustment" onClose={() => setAdjModal(false)}>
          <form onSubmit={handleAdjSave} className="space-y-4">
            <div>
              <label className="label-overline block mb-1">Raw Material *</label>
              <select required className="w-full h-9 px-3 border border-slate-300 rounded-md text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500" value={adjForm.raw_material} onChange={e => setAdjForm({ ...adjForm, raw_material: e.target.value })} data-testid="adj-material">
                <option value="">— Select item —</option>
                {stock.map(s => <option key={s.id} value={s.id}>{s.item_id} — {s.item_name} (Stock: {Number(s.current_stock).toFixed(4)} {s.unit})</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-overline block mb-1">Type *</label>
                <select className="w-full h-9 px-3 border border-slate-300 rounded-md text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500" value={adjForm.adjustment_type} onChange={e => setAdjForm({ ...adjForm, adjustment_type: e.target.value })}>
                  <option value="ADD">Add Stock</option>
                  <option value="SUBTRACT">Subtract Stock</option>
                </select>
              </div>
              <div>
                <label className="label-overline block mb-1">Quantity *</label>
                <input type="number" step="0.0001" min="0.0001" required className="w-full h-9 px-3 border border-slate-300 rounded-md text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono" value={adjForm.quantity} onChange={e => setAdjForm({ ...adjForm, quantity: e.target.value })} data-testid="adj-qty" />
              </div>
            </div>
            <div>
              <label className="label-overline block mb-1">Reason *</label>
              <textarea required rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none" value={adjForm.reason} onChange={e => setAdjForm({ ...adjForm, reason: e.target.value })} placeholder="Reason for adjustment..." data-testid="adj-reason" />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="flex-1 h-10 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white text-sm font-medium rounded-md" data-testid="adj-save-btn">
                {saving ? 'Processing...' : 'Save Adjustment'}
              </button>
              <button type="button" onClick={() => setAdjModal(false)} className="h-10 px-4 border border-slate-300 text-sm rounded-md hover:bg-slate-50">Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
