import React, { useEffect, useState, useRef } from 'react';
import { masterAPI, inventoryAPI } from '@/services/api';
import { Plus, Pencil, Trash2, X, Search, AlertCircle, Upload, FileDown, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { ArrowUpDown } from "lucide-react";

const CATEGORIES = ['ELECTRICAL', 'MECHANICAL', 'HARDWARE', 'PACKAGING', 'CONSUMABLE', 'OTHER'];
const UNITS = ['PCS', 'KG', 'MTR', 'LTR', 'SET', 'ROLL', 'BOX', 'GM', 'MM'];
const EMPTY = { item_id: '', item_name: '', category: 'ELECTRICAL', unit: 'PCS', reorder_level: 0, default_cost: 0, lead_time: 0, status: true };


function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-md shadow-xl w-full max-w-lg border border-slate-200 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 flex-shrink-0">
          <h2 className="font-heading font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-5">{children}</div>
      </div>
    </div>
  );
}

function BulkImportModal({ onClose, onSuccess }) {
  const [stage, setStage] = useState('upload');
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState(null);
  const fileRef = useRef();


  const downloadSample = async () => {
    try {
      const res = await inventoryAPI.sampleDownload();

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'opening_stock_sample.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();

    } catch (err) {
      toast.error("Sample download failed");
    }
  };

  const processFile = async (file) => {
    if (!file) return;

    setFileName(file.name);

    const ext = file.name.split('.').pop().toLowerCase();

    if (!['csv', 'xlsx', 'xls'].includes(ext)) {
      toast.error('Only .csv, .xlsx, .xls files are supported');
      return;
    }

    setStage('uploading');

    try {
      const r = await inventoryAPI.importOpeningStock(file);

      console.log("IMPORT RESPONSE:", r.data);

      setResult(r.data);
      setStage('result');

      if (r.data.created > 0 || r.data.updated > 0) {
        toast.success(
          `Import complete: ${r.data.created} created, ${r.data.updated} updated`
        );
      }

      if (r.data.errors > 0) {
        toast.error(`${r.data.errors} rows failed. Check result table.`);
      }

    } catch (err) {

      console.error("IMPORT ERROR:", err);

      let message = "Import failed";

      if (err.response?.data) {
        if (err.response.data.error) {
          message = err.response.data.error;
        }
        else if (err.response.data.error_items) {
          message = err.response.data.error_items.join("\n");
        }
      }

      toast.error(message);
      setStage('upload');
    }
  };

  const handleFilePick = e => processFile(e.target.files?.[0]);
  const handleDrop = e => { e.preventDefault(); setDragOver(false); processFile(e.dataTransfer.files?.[0]); };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-md shadow-xl w-full max-w-xl border border-slate-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div>
            <h2 className="font-heading font-bold text-slate-900">Bulk Opening Stock Import</h2>
            <p className="text-xs text-slate-500 mt-0.5">Upload Excel or CSV to create/update raw materials with opening stock</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          {stage === 'upload' && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-md px-4 py-3 flex gap-3 text-sm text-blue-700">
                <Info size={16} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-1">How it works</p>
                  <ul className="space-y-0.5 text-xs">
                    <li>• New materials are <strong>created</strong> with opening stock quantity</li>
                    <li>• Existing materials with zero stock get <strong>updated</strong></li>
                    <li>• Materials already with stock are <strong>skipped</strong> safely</li>
                  </ul>
                </div>
              </div>
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-md px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-700">Download Sample Template</p>
                  <p className="text-xs text-slate-400 mt-0.5">Pre-filled Excel with correct column headers &amp; sample rows</p>
                </div>
                <button
                  onClick={downloadSample}
                  className="flex items-center gap-1.5 h-8 px-3 bg-white border border-emerald-300 text-emerald-700 rounded-md text-xs font-medium hover:bg-emerald-50"
                >
                  <FileDown size={13} /> Download
                </button>
              </div>
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-md px-6 py-10 text-center cursor-pointer transition-colors ${dragOver ? 'border-orange-400 bg-orange-50' : 'border-slate-300 hover:border-orange-400 hover:bg-orange-50/30'}`}
                data-testid="import-drop-zone"
              >
                <Upload size={28} className="mx-auto text-slate-300 mb-3" />
                <p className="text-sm font-medium text-slate-600">Drop your Excel/CSV file here</p>
                <p className="text-xs text-slate-400 mt-1">or click to browse — .xlsx, .xls, .csv supported</p>
                {fileName && (
                    <p className="text-xs text-slate-500 mt-2">
                      Selected file: <span className="font-medium">{fileName}</span>
                    </p>
                  )}
                <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFilePick} data-testid="import-file-input" />
              </div>
            </>
          )}
          {stage === 'uploading' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="w-10 h-10 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-600">Processing your file...</p>
            </div>
          )}
          {stage === 'result' && result && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-2">
                <div className="text-center bg-emerald-50 border border-emerald-200 rounded-md py-3">
                  <p className="font-mono font-black text-xl text-emerald-600">{result.created}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Created</p>
                </div>
                <div className="text-center bg-blue-50 border border-blue-200 rounded-md py-3">
                  <p className="font-mono font-black text-xl text-blue-600">{result.updated}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Updated</p>
                </div>
                <div className="text-center bg-amber-50 border border-amber-200 rounded-md py-3">
                  <p className="font-mono font-black text-xl text-amber-600">{result.skipped}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Skipped</p>
                </div>
                <div className="text-center bg-red-50 border border-red-200 rounded-md py-3">
                  <p className="font-mono font-black text-xl text-red-600">{result.errors}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Errors</p>
                </div>
              </div>
              {result.created_items?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-emerald-700 mb-1 uppercase tracking-wider">Created ({result.created})</p>
                  <div className="bg-emerald-50 rounded-md px-3 py-2 max-h-28 overflow-y-auto space-y-0.5">
                    {result.created_items.map((s, i) => <p key={i} className="text-xs text-emerald-700">{s}</p>)}
                  </div>
                </div>
              )}
              {result.updated_items?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-blue-700 mb-1 uppercase tracking-wider">Updated ({result.updated})</p>
                  <div className="bg-blue-50 rounded-md px-3 py-2 max-h-28 overflow-y-auto space-y-0.5">
                    {result.updated_items.map((s, i) => <p key={i} className="text-xs text-blue-700">{s}</p>)}
                  </div>
                </div>
              )}
              {result.skipped_items?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-amber-700 mb-1 uppercase tracking-wider">Skipped ({result.skipped})</p>
                  <div className="bg-amber-50 rounded-md px-3 py-2 max-h-24 overflow-y-auto space-y-0.5">
                    {result.skipped_items.map((s, i) => <p key={i} className="text-xs text-amber-700">{s}</p>)}
                  </div>
                </div>
              )}
              {result.error_items?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-red-700 mb-1 uppercase tracking-wider">Errors ({result.errors})</p>
                  <div className="bg-red-50 rounded-md px-3 py-2 max-h-24 overflow-y-auto space-y-0.5">
                    {result.error_items.map((s, i) => <p key={i} className="text-xs text-red-700">{s}</p>)}
                  </div>
                </div>
              )}
              <div className="flex gap-3 pt-1">
                <button onClick={onSuccess} className="flex-1 h-10 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-md" data-testid="import-done-btn">
                  Done — View Updated List
                </button>
                <button onClick={() => { setStage('upload'); setResult(null); }} className="h-10 px-4 border border-slate-300 text-sm rounded-md hover:bg-slate-50">
                  Import Another
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RawMaterials() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const importFileRef = useRef();
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "asc",
  });

  const fetchItems = () => {
    masterAPI.rawMaterials().then(r => { setItems(r.data); setLoading(false); });
  };
  useEffect(() => { fetchItems(); }, []);

  const openCreate = () => { setForm(EMPTY); setEditItem(null); setModalOpen(true); };
  const openEdit = item => {
    setForm({ ...item, reorder_level: item.reorder_level, default_cost: item.default_cost, lead_time: item.lead_time });
    setEditItem(item);
    setModalOpen(true);
  };

  const handleSave = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editItem) {
        await masterAPI.updateRawMaterial(editItem.id, form);
        toast.success('Item updated');
      } else {
        await masterAPI.createRawMaterial(form);
        toast.success('Item created');
      }
      setModalOpen(false);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.item_id?.[0] || err.response?.data?.detail || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async item => {
    if (!window.confirm(`Delete "${item.item_name}"?`)) return;
    try {
      await masterAPI.deleteRawMaterial(item.id);
      toast.success('Item deleted');
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Cannot delete');
    }
  };

  const handleSort = (key) => {

    let direction = "asc";

    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }

    const sorted = [...items].sort((a, b) => {

      if (typeof a[key] === "string") {
        return direction === "asc"
          ? a[key].localeCompare(b[key])
          : b[key].localeCompare(a[key]);
      }

      return direction === "asc"
        ? a[key] - b[key]
        : b[key] - a[key];

    });

    setItems(sorted);
    setSortConfig({ key, direction });

  };
  const filtered = items.filter(i =>
    i.item_name.toLowerCase().includes(search.toLowerCase()) ||
    i.item_id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 animate-fade-in" data-testid="raw-materials-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or ID..."
            className="w-full h-9 pl-9 pr-3 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            data-testid="rm-search"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setImportModalOpen(true)}
            className="flex items-center gap-2 h-9 px-3 border border-slate-300 hover:border-orange-400 hover:text-orange-600 text-slate-600 text-sm font-medium rounded-md transition-colors"
            data-testid="bulk-import-btn"
          >
            <Upload size={14} /> Bulk Import
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 h-9 px-4 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-md transition-colors"
            data-testid="add-rm-btn"
          >
            <Plus size={15} /> Add Item
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="stat-card py-3 text-center">
          <p className="label-overline">Total Items</p>
          <p className="font-heading font-black text-2xl text-slate-900 font-mono">{items.length}</p>
        </div>

        <div className="stat-card py-3 text-center">
          <p className="label-overline">Below Reorder</p>
          <p className="font-heading font-black text-2xl text-red-600 font-mono">{items.filter(i => i.is_below_reorder).length}</p>
        </div>
        <div className="stat-card py-3 text-center">
          <p className="label-overline">Stock Value</p>
          <p className="font-heading font-black text-xl text-slate-900 font-mono">
            ₹{items.reduce((s, i) => s + Number(i.stock_value || 0), 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-md shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table w-full" data-testid="rm-table">
              <thead>
                <tr>
                <th onClick={() => handleSort("item_id")} className="cursor-pointer">
                  <div className="flex items-center gap-1">
                    ITEM ID <ArrowUpDown size={14} />
                  </div>
                </th>
                <th>ITEM NAME</th>
                <th>CATEGORY</th>
                <th>UNIT</th>
                <th onClick={() => handleSort("current_stock")}>STOCK</th>
                <th onClick={() => handleSort("default_cost")}>DEFAULT COST</th>
                <th>REORDER</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
                </tr>
                </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-10 text-slate-400">No items found</td></tr>
                ) : filtered.map(item => (
                  <tr key={item.id}>
                    <td className="font-mono text-xs text-slate-500">{item.item_id}</td>
                    <td className="font-medium text-slate-900">{item.item_name}</td>
                    <td><span className="badge-neutral">{item.category}</span></td>
                    <td className="font-mono text-xs">{item.unit}</td>
                    <td className={`text-slate-900 font-mono font-semibold ${item.is_below_reorder ? 'text-red-00' : 'text-slate-900'}`}>
                      {Number(item.current_stock).toFixed(2)}
                      {item.is_below_reorder && <AlertCircle size={12} className="inline ml-1 text-red-500" />}
                    </td>
                    <td className="text-slate-900 font-mono">₹{Number(item.moving_avg_cost).toFixed(4)}</td>
                    <td className="text-slate-900 text-slate-500">{Number(item.reorder_level).toFixed(2)}</td>
                    <td>
                      <span className={item.status ? 'badge-success' : 'badge-neutral'}>
                        {item.status ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="text-left">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(item)} className="text-slate-400 hover:text-blue-600" data-testid={`edit-rm-${item.id}`}><Pencil size={14} /></button>
                        <button onClick={() => handleDelete(item)} className="text-slate-400 hover:text-red-600" data-testid={`del-rm-${item.id}`}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {importModalOpen && (
        <BulkImportModal
          onClose={() => setImportModalOpen(false)}
          onSuccess={() => { setImportModalOpen(false); fetchItems(); }}
          fileRef={importFileRef}
        />
      )}

      {/* Modal */}
      {modalOpen && (<Modal title={editItem ? 'Edit Raw Material' : 'Add Raw Material'} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-overline block mb-1">Item ID *</label>
              <input className="w-full h-9 px-3 border border-slate-300 rounded-md text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500" required value={form.item_id} onChange={e => setForm({ ...form, item_id: e.target.value })} data-testid="rm-form-item-id" />
            </div>
            <div>
              <label className="label-overline block mb-1">Category</label>
              <select className="w-full h-9 px-3 border border-slate-300 rounded-md text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label-overline block mb-1">Item Name *</label>
            <input className="w-full h-9 px-3 border border-slate-300 rounded-md text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500" required value={form.item_name} onChange={e => setForm({ ...form, item_name: e.target.value })} data-testid="rm-form-name" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label-overline block mb-1">Unit</label>
              <select className="w-full h-9 px-3 border border-slate-300 rounded-md text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="label-overline block mb-1.5">Current Stock</label>
              <input
                type="number"
                value={form.current_stock}
                onChange={e => setForm({ ...form, current_stock: e.target.value })}
                className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-md"
              />
            </div>

            <div>
              <label className="label-overline block mb-1.5">Default Cost</label>
              <input
                type="number"
                step="0.0001"
                value={form.default_cost}
                onChange={e => setForm({ ...form, default_cost: e.target.value })}
                className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-md"
              />
            </div>

            <div>
              <label className="label-overline block mb-1">AVG Cost</label>
              <input type="number" step="0.0001" className="w-full h-9 px-3 border border-slate-300 rounded-md text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500" value={form.moving_avg_cost} onChange={e => setForm({ ...form, moving_avg_cost: e.target.value })} />
            </div>
            <div>
              <label className="label-overline block mb-1">Reorder Level</label>
              <input type="number" step="0.0001" className="w-full h-9 px-3 border border-slate-300 rounded-md text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500" value={form.reorder_level} onChange={e => setForm({ ...form, reorder_level: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-overline block mb-1">Lead Time (days)</label>
              <input type="number" className="w-full h-9 px-3 border border-slate-300 rounded-md text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500" value={form.lead_time} onChange={e => setForm({ ...form, lead_time: e.target.value })} />
            </div>
            <div className="flex items-center gap-3 pt-5">
              <input type="checkbox" id="status" checked={form.status} onChange={e => setForm({ ...form, status: e.target.checked })} className="w-4 h-4 accent-orange-600" />
              <label htmlFor="status" className="text-sm font-medium text-slate-700">Active</label>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="flex-1 h-10 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white text-sm font-medium rounded-md" data-testid="rm-save-btn">
              {saving ? 'Saving...' : editItem ? 'Update Item' : 'Create Item'}
            </button>
            <button type="button" onClick={() => setModalOpen(false)} className="h-10 px-4 border border-slate-300 text-sm rounded-md hover:bg-slate-50">Cancel</button>
          </div>
        </form>
      </Modal>
      )}
    </div>
  );
}
