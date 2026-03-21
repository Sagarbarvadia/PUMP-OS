import React, { useEffect, useState, useRef } from 'react';
import { masterAPI, bomAPI } from '@/services/api';
import { Plus, Trash2, X, Download, Upload, FileDown, RefreshCw, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

export default function BOM() {
  const [products, setProducts] = useState([]);

  const [materials, setMaterials] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [bom, setBom] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState([]);
  const fileRef = useRef();

  useEffect(() => {
    masterAPI.products({ status: 'true' }).then(r => setProducts(r.data));
    masterAPI.rawMaterials({ status: 'true' }).then(r => setMaterials(r.data));
  }, []);

  const loadBOM = async modelId => {
    if (!modelId) { setBom(null); setItems([]); return; }
    setLoading(true);
    try {
      const r = await bomAPI.list({ product_model: modelId });
      const activeBom = r.data.find(b => b.is_active) || r.data[0];
      if (activeBom) {
        const detail = await bomAPI.get(activeBom.id);
        setBom(detail.data);
        setItems(detail.data.items.map(i => ({
          id: i.id,
          raw_material: i.raw_material,
          raw_material_detail: i.raw_material_detail,
          qty_per_unit: i.qty_per_unit,
          scrap_percent: i.scrap_percent,
          process_stage: i.process_stage,
        })));
      } else {
        setBom(null);
        setItems([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleModelChange = e => {
    setSelectedModel(e.target.value);
    loadBOM(e.target.value);
  };

  const addRow = () => setItems(prev => [...prev, { raw_material: '', qty_per_unit: '1', scrap_percent: '0', process_stage: '' }]);

  const removeRow = idx => setItems(prev => prev.filter((_, i) => i !== idx));

  const updateRow = (idx, field, value) => setItems(prev => {
    const updated = [...prev];
    updated[idx] = { ...updated[idx], [field]: value };
    if (field === 'raw_material') {
      updated[idx].raw_material_detail = materials.find(m => m.id === parseInt(value));
    }
    return updated;
  });

  const handleSave = async () => {
    if (!selectedModel) { toast.error('Select a product model first'); return; }
    if (items.some(i => !i.raw_material)) { toast.error('All rows must have a raw material selected'); return; }
    setSaving(true);
    try {
      const payload = {
        product_model: selectedModel,
        items: items.map(i => ({
          raw_material: parseInt(i.raw_material),
          qty_per_unit: parseFloat(i.qty_per_unit) || 0,
          scrap_percent: parseFloat(i.scrap_percent) || 0,
          process_stage: i.process_stage || '',
        }))
      };
      if (bom) {
        await bomAPI.update(bom.id, payload);
        toast.success('BOM updated');
      } else {
        await bomAPI.create({ product_model: selectedModel, items: [] });
        toast.success('BOM created');
      }
      loadBOM(selectedModel);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleImport = async e => {
    const file = e.target.files?.[0];
    if (!file || !selectedModel) { toast.error('Select a product model first'); return; }
    try {
      const r = await bomAPI.import(selectedModel, file);
      toast.success(`Imported ${r.data.imported} items`);
      if (r.data.skipped.length > 0) toast.warning(`Skipped: ${r.data.skipped.join(', ')}`);
      loadBOM(selectedModel);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Import failed');
    }
    e.target.value = '';
  };

  const totalCost = items.reduce((sum, item) => {
    const mat = materials.find(m => m.id === parseInt(item.raw_material));
    if (!mat) return sum;
    const rate = parseFloat(mat.moving_avg_cost) || parseFloat(mat.default_cost) || 0;
    const eff = parseFloat(item.qty_per_unit) * (1 + parseFloat(item.scrap_percent || 0) / 100);
    return sum + eff * rate;
  }, 0);

  const downloadSample = async () => {
  try {
    const res = await bomAPI.sampleDownload();

    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.download = "bom_sample.xlsx";
    document.body.appendChild(link);
    link.click();
    link.remove();

  } catch (err) {
    toast.error("Sample download failed");
  }
};

  const downloadExport = async () => {
    if (!bom) return;
    try {
      const res = await bomAPI.export(bom.id);

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `BOM_${bom.product_model.model_id}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();

    } catch (err) {
      toast.error("Export failed");
    }
  };

  return (
    <div className="space-y-4 animate-fade-in" data-testid="bom-page">
      {/* Model selector + Actions */}
      <div className="bg-white border border-slate-200 rounded-md shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="flex-1">
            <label className="label-overline block mb-1">Product Model</label>
            <select
              value={selectedModel}
              onChange={handleModelChange}
              className="w-full h-10 px-3 border border-slate-300 rounded-md text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
              data-testid="bom-model-select"
            >
              <option value="">— Select a model —</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.model_id} — {p.model_name}</option>)}
            </select>
          </div>
          {selectedModel && (
            <div className="flex gap-2 sm:mt-5">
              <input type="file" ref={fileRef} accept=".csv,.xlsx,.xls" onChange={handleImport} className="hidden" />
              <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 h-9 px-3 border border-slate-300 rounded-md text-sm hover:bg-slate-50" data-testid="bom-import-btn">
                <Upload size={14} /> Import
              </button>
              {bom && (
                <button onClick={downloadExport} className="flex items-center gap-1.5 h-9 px-3 border border-slate-300 rounded-md text-sm hover:bg-slate-50" data-testid="bom-export-btn">
                  <Download size={14} /> Export
                </button>
              )}
              <button
                  onClick={downloadSample}
                  className="flex items-center gap-1.5 h-9 px-3 border border-emerald-300 text-emerald-700 rounded-md text-sm hover:bg-emerald-50"
                >
                  <FileDown size={14} /> Sample
              </button>
            </div>
          )}
        </div>
        {bom && (
          <div className="mt-3 flex items-center gap-4 text-sm text-slate-600">
            <span className="font-mono">{bom.item_count} components</span>
            <span>•</span>
            <span className="font-mono font-semibold text-orange-600">₹{Number(bom.total_cost).toFixed(4)} / unit</span>
            <span>•</span>
            <span className="text-slate-400">Updated {new Date(bom.updated_at).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {!selectedModel ? (
        <div className="bg-white border border-slate-200 rounded-md p-12 text-center text-slate-400">
          Select a product model to view or edit its BOM
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-md shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <p className="font-heading font-bold text-slate-900">BOM Items ({items.length})</p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500 font-mono">Live Cost: <strong className="text-orange-600">₹{totalCost.toFixed(4)}</strong></span>
              <button onClick={addRow} className="flex items-center gap-1 h-8 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm rounded-md" data-testid="bom-add-row">
                <Plus size={13} /> Add Row
              </button>
            </div>
          </div>

          <div className="table-scroll">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>#</th><th>Raw Material *</th><th className="text-right">Qty/Unit *</th>
                  <th className="text-right w-40">Scrap %</th><th>Stage</th>
                  <th className="text-right w-20">Eff. Qty</th>
                  <th className="text-right w-20">Cost</th><th></th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-8 text-slate-400">No items — click "Add Row" to start</td></tr>
                ) : items.map((item, idx) => {
                  const mat = materials.find(m => m.id === parseInt(item.raw_material));
                  const rate = mat ? (parseFloat(mat.moving_avg_cost) || parseFloat(mat.default_cost) || 0) : 0;
                  const eff = parseFloat(item.qty_per_unit || 0) * (1 + parseFloat(item.scrap_percent || 0) / 100);
                  const cost = eff * rate;
                  return (
                    <tr key={idx}>
                      <td className="text-slate-400 font-mono text-xs w-8">{idx + 1}</td>
                      <td>
                        <select
                          className="w-full h-8 px-2 border border-slate-200 rounded text-xs bg-slate-50 focus:outline-none focus:ring-1 focus:ring-orange-500"
                          value={item.raw_material}
                          onChange={e => updateRow(idx, 'raw_material', e.target.value)}
                        >
                          <option value="">Select...</option>
                          {materials.map(m => <option key={m.id} value={m.id}>{m.item_id} — {m.item_name} ({m.unit})</option>)}
                        </select>
                      </td>
                      <td className="text-right w-40">
                        <input type="number" step="0.0001" min="0" className="w-full h-8 px-2 border border-slate-200 rounded text-xs text-right bg-slate-50 focus:outline-none focus:ring-1 focus:ring-orange-500 font-mono" value={item.qty_per_unit} onChange={e => updateRow(idx, 'qty_per_unit', e.target.value)} />
                      </td>
                      <td className="text-right w-50">
                        <input type="number" step="0.01" min="0" max="100" className="w-full h-8 px-2 border border-slate-200 rounded text-xs text-right bg-slate-50 focus:outline-none focus:ring-1 focus:ring-orange-500 font-mono" value={item.scrap_percent} onChange={e => updateRow(idx, 'scrap_percent', e.target.value)} />
                      </td>
                      <td>
                        <input type="text" className="w-full h-8 px-2 border border-slate-200 rounded text-xs bg-slate-50 focus:outline-none focus:ring-1 focus:ring-orange-500" value={item.process_stage} onChange={e => updateRow(idx, 'process_stage', e.target.value)} placeholder="e.g. Winding" />
                      </td>
                      <td className="text-left font-mono text-xs text-slate-500">{eff.toFixed(4)}</td>
                      <td className="text-left font-mono text-xs font-semibold text-slate-700">₹{cost.toFixed(4)}</td>
                      <td><button onClick={() => removeRow(idx)} className="text-slate-300 hover:text-red-500"><Trash2 size={13} /></button></td>
                    </tr>
                  );
                })}
              </tbody>
              {items.length > 0 && (
                <tfoot>
                  <tr className="bg-orange-50">
                    <td colSpan={6} className="px-4 py-3 text-sm font-bold text-slate-700 text-right">Total BOM Cost</td>
                    <td className="px-4 py-3 text-right font-mono font-black text-orange-600">₹{totalCost.toFixed(4)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          <div className="px-4 py-3 border-t border-slate-100 flex justify-end">
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 h-10 px-6 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white text-sm font-medium rounded-md" data-testid="bom-save-btn">
              {saving ? <RefreshCw size={14} className="animate-spin" /> : null}
              {saving ? 'Saving...' : 'Save BOM'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
