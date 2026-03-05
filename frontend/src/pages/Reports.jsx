import React, { useEffect, useState } from 'react';
import { masterAPI, reportsAPI } from '@/services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download } from 'lucide-react';

const TABS = ['RM Stock', 'Finished Goods', 'Monthly Production', 'Daily Production', 'BOM Cost', 'Wastage', 'Reorder', 'Stock Movement'];

const today = new Date().toISOString().slice(0, 10);

export default function Reports() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [products, setProducts] = useState([]);

  // Filters
  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    date: today,
    model: '',
    from: today.slice(0, 7) + '-01',
    to: today,
    item: '',
    category: '',
  });

  useEffect(() => { masterAPI.products().then(r => setProducts(r.data)); }, []);

  const loadReport = async (tabIdx = tab) => {
    setLoading(true);
    setData(null);
    try {
      let r;
      switch (tabIdx) {
        case 0: r = await reportsAPI.rmStock({ category: filters.category }); break;
        case 1: r = await reportsAPI.finishedGoods(); break;
        case 2: r = await reportsAPI.monthlyProduction({ month: filters.month, year: filters.year, model: filters.model }); break;
        case 3: r = await reportsAPI.dailyProduction({ date: filters.date }); break;
        case 4: r = await reportsAPI.bomCost({ model: filters.model }); break;
        case 5: r = await reportsAPI.wastage({ from: filters.from, to: filters.to }); break;
        case 6: r = await reportsAPI.reorder(); break;
        case 7: r = await reportsAPI.stockMovement({ item: filters.item, from: filters.from, to: filters.to }); break;
        default: return;
      }
      setData(r.data);
    } catch (e) {
      setData({ error: e.response?.data?.error || 'Report failed' });
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadReport(tab); }, [tab]);

  const setTab_ = i => { setTab(i); };

  return (
    <div className="space-y-4 animate-fade-in" data-testid="reports-page">
      {/* Tab strip */}
      <div className="flex gap-1 flex-wrap bg-white border border-slate-200 rounded-md p-1 shadow-sm">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab_(i)}
            className={`px-3 h-8 rounded text-xs font-medium transition-colors whitespace-nowrap ${tab === i ? 'bg-orange-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            data-testid={`report-tab-${i}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-md shadow-sm p-4">
        <div className="flex flex-wrap gap-3 items-end">
          {tab === 2 && (
            <>
              <div>
                <label className="label-overline block mb-1">Month</label>
                <select className="h-9 px-3 border border-slate-300 rounded-md text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500" value={filters.month} onChange={e => setFilters({ ...filters, month: e.target.value })}>
                  {[...Array(12)].map((_, i) => <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>)}
                </select>
              </div>
              <div>
                <label className="label-overline block mb-1">Year</label>
                <select className="h-9 px-3 border border-slate-300 rounded-md text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500" value={filters.year} onChange={e => setFilters({ ...filters, year: e.target.value })}>
                  {[2023, 2024, 2025, 2026].map(y => <option key={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className="label-overline block mb-1">Model (optional)</label>
                <select className="h-9 px-3 border border-slate-300 rounded-md text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500" value={filters.model} onChange={e => setFilters({ ...filters, model: e.target.value })}>
                  <option value="">All Models</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.model_name}</option>)}
                </select>
              </div>
            </>
          )}
          {tab === 3 && (
            <div>
              <label className="label-overline block mb-1">Date</label>
              <input type="date" value={filters.date} onChange={e => setFilters({ ...filters, date: e.target.value })} className="h-9 px-3 border border-slate-300 rounded-md text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
          )}
          {tab === 4 && (
            <div>
              <label className="label-overline block mb-1">Product Model *</label>
              <select required className="h-9 px-3 border border-slate-300 rounded-md text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500" value={filters.model} onChange={e => setFilters({ ...filters, model: e.target.value })}>
                <option value="">— Select model —</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.model_name}</option>)}
              </select>
            </div>
          )}
          {(tab === 5 || tab === 7) && (
            <>
              <div>
                <label className="label-overline block mb-1">From</label>
                <input type="date" value={filters.from} onChange={e => setFilters({ ...filters, from: e.target.value })} className="h-9 px-3 border border-slate-300 rounded-md text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="label-overline block mb-1">To</label>
                <input type="date" value={filters.to} onChange={e => setFilters({ ...filters, to: e.target.value })} className="h-9 px-3 border border-slate-300 rounded-md text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
            </>
          )}
          <button onClick={() => loadReport(tab)} className="h-9 px-4 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-md" data-testid="run-report-btn">
            Run Report
          </button>
        </div>
      </div>

      {/* Report output */}
      {loading ? (
        <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : data ? (
        <ReportResult tab={tab} data={data} />
      ) : null}
    </div>
  );
}

function ReportResult({ tab, data }) {
  if (data.error) return <div className="bg-red-50 border border-red-200 rounded-md px-4 py-3 text-red-700 text-sm">{data.error}</div>;

  if (tab === 0) {
    const items = data.items || [];
    return (
      <div className="space-y-3">
        <div className="bg-white border border-slate-200 rounded-md p-4 flex items-center justify-between">
          <span className="label-overline">Total Stock Value</span>
          <span className="font-mono font-black text-2xl text-orange-600">₹{Number(data.total_value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-md shadow-sm">
          <div className="table-scroll">
            <table className="data-table w-full">
              <thead><tr><th>Item ID</th><th>Name</th><th>Cat</th><th className="text-right w-20">Stock</th><th className="text-right w-20">Avg Cost</th><th className="text-right w-20">Value</th><th>Status</th></tr></thead>
              <tbody>
                {items.map((i, idx) => (
                  <tr key={idx}>
                    <td className="font-mono text-xs">{i.item_id}</td>
                    <td className="font-medium">{i.item_name}</td>
                    <td><span className="badge-neutral text-xs">{i.category}</span></td>
                    <td className="text-right font-mono">{Number(i.current_stock).toFixed(4)} {i.unit}</td>
                    <td className="text-right font-mono">₹{Number(i.moving_avg_cost).toFixed(4)}</td>
                    <td className="text-right font-mono font-semibold">₹{Number(i.stock_value).toFixed(2)}</td>
                    <td><span className={i.status === 'OK' ? 'badge-success' : 'badge-error'}>{i.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (tab === 1) {
    const fgRows = Array.isArray(data) ? data : [];
    return (
      <div className="bg-white border border-slate-200 rounded-md shadow-sm">
        <div className="table-scroll">
          <table className="data-table w-full">
            <thead><tr><th>Model ID</th><th>Model Name</th><th className="text-right w-20">FG Stock</th><th className="text-right w-20">Scrap</th><th className="text-right w-20">Mfg Cost</th><th className="text-right w-20">FG Value</th></tr></thead>
            <tbody>
              {fgRows.length === 0
                ? <tr><td colSpan={6} className="text-center py-8 text-slate-400">No finished goods data</td></tr>
                : fgRows.map((d, i) => <tr key={i}>
                <td className="font-mono text-xs">{d.model_id}</td>
                <td className="font-medium">{d.model_name}</td>
                <td className="text-right font-mono text-emerald-600 font-semibold">{d.finished_goods}</td>
                <td className="text-right font-mono text-red-500 w-20 ">{d.scrap}</td>
                <td className="text-right font-mono">₹{Number(d.manufacturing_cost).toFixed(4)}</td>
                <td className="text-right font-mono font-semibold">₹{Number(d.fg_value).toFixed(2)}</td>
              </tr>)}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (tab === 2) {
    const rows = data.data || [];
    return (
      <div className="space-y-4">
        <p className="label-overline">Period: {data.month}</p>
        <div className="bg-white border border-slate-200 rounded-md shadow-sm p-4">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="model_name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Bar dataKey="total_produced" name="Produced" fill="#EA580C" radius={[2, 2, 0, 0]} />
              <Bar dataKey="total_rejected" name="Rejected" fill="#fca5a5" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white border border-slate-200 rounded-md shadow-sm">
          <div className="table-scroll">
            <table className="data-table w-full">
              <thead><tr><th>Model</th><th className="text-right">Produced</th><th className="text-right">Rejected</th><th className="text-right">Net</th><th className="text-right">Total Cost</th><th className="text-right">Orders</th></tr></thead>
              <tbody>
                {rows.map((r, i) => <tr key={i}>
                  <td className="font-medium">{r.model_name}</td>
                  <td className="text-right font-mono">{r.total_produced}</td>
                  <td className="text-right font-mono text-red-500">{r.total_rejected}</td>
                  <td className="text-right font-mono font-bold text-emerald-600">{r.net_production}</td>
                  <td className="text-right font-mono">₹{Number(r.total_cost).toFixed(2)}</td>
                  <td className="text-right font-mono">{r.order_count}</td>
                </tr>)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (tab === 4 && data.items) {
    return (
      <div className="space-y-3">
        <div className="bg-white border border-slate-200 rounded-md p-4 flex items-center justify-between">
          <div>
            <p className="label-overline">Total BOM Cost</p>
            <p className="font-heading font-black text-2xl text-orange-600 font-mono">₹{Number(data.total_cost).toFixed(4)} / unit</p>
          </div>
          <div className="text-right text-sm text-slate-500">
            <p>{data.model_id} — {data.model_name}</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-md shadow-sm">
          <div className="table-scroll">
            <table className="data-table w-full">
              <thead><tr><th>Item ID</th><th>Item Name</th><th>Unit</th><th className="text-right">Qty/Unit</th><th className="text-right">Scrap%</th><th className="text-right">Eff. Qty</th><th className="text-right">Rate</th><th className="text-right">Cost</th><th>Stage</th></tr></thead>
              <tbody>
                {data.items.map((i, idx) => <tr key={idx}>
                  <td className="font-mono text-xs">{i.item_id}</td>
                  <td className="font-medium">{i.item_name}</td>
                  <td className="font-mono text-xs">{i.unit}</td>
                  <td className="text-right font-mono">{i.qty_per_unit}</td>
                  <td className="text-right font-mono">{i.scrap_percent}%</td>
                  <td className="text-right font-mono">{i.effective_qty}</td>
                  <td className="text-right font-mono">₹{i.rate}</td>
                  <td className="text-right font-mono font-semibold text-orange-600">₹{i.line_cost}</td>
                  <td className="text-xs text-slate-500">{i.process_stage || '—'}</td>
                </tr>)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Generic table
  const rows = Array.isArray(data) ? data : (data.orders || data.data || [data]);
  if (rows.length === 0) return <div className="bg-white border border-slate-200 rounded-md p-8 text-center text-slate-400">No data for selected criteria</div>;
  const keys = Object.keys(rows[0]);
  return (
    <div className="bg-white border border-slate-200 rounded-md shadow-sm">
      <div className="table-scroll">
        <table className="data-table w-full">
          <thead><tr>{keys.map(k => <th key={k}>{k.replace(/_/g, ' ').toUpperCase()}</th>)}</tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                {keys.map(k => <td key={k} className={typeof r[k] === 'number' ? 'font-mono text-right' : ''}>{typeof r[k] === 'number' ? Number(r[k]).toFixed(2) : String(r[k] ?? '—')}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
