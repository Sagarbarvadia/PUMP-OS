import React, { useEffect, useState } from 'react';
import { dashboardAPI } from '@/services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Package, Factory, AlertTriangle, TrendingUp, Layers, Wrench } from 'lucide-react';

function KpiCard({ label, value, sub, icon: Icon, color = 'orange', testid }) {
  const colors = {
    orange: 'bg-orange-50 text-orange-600',
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    red: 'bg-red-50 text-red-600',
  };
  return (
    <div className="stat-card animate-fade-in" data-testid={testid}>
      <div className="flex items-start justify-between">
        <div>
          <p className="label-overline mb-2">{label}</p>
          <p className="font-heading font-black text-3xl text-slate-900 font-mono">{value}</p>
          {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-md flex items-center justify-center ${colors[color]}`}>
          <Icon size={20} strokeWidth={1.5} />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.get().then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!data) return <div className="text-slate-500">Failed to load dashboard</div>;

  const { kpis, monthly_production_trend, current_month_model_wise, top_consumed_materials, scrap_summary, reorder_items } = data;

  return (
    <div className="space-y-6 animate-fade-in" data-testid="dashboard-page">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="RM Stock Value"
          value={`₹${(kpis.rm_stock_value).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          sub={`${kpis.rm_item_count} items`}
          icon={Package}
          color="blue"
          testid="kpi-rm-value"
        />
        <KpiCard
          label="Finished Goods"
          value={kpis.fg_total.toLocaleString('en-IN')}
          sub="units in stock"
          icon={Layers}
          color="green"
          testid="kpi-fg-stock"
        />
        <KpiCard
          label="Today's Production"
          value={kpis.today_produced}
          sub={`${kpis.today_rejected} rejected`}
          icon={Factory}
          color="orange"
          testid="kpi-today-production"
        />
        <KpiCard
          label="Reorder Alerts"
          value={kpis.reorder_alerts}
          sub="items below reorder"
          icon={AlertTriangle}
          color={kpis.reorder_alerts > 0 ? 'red' : 'green'}
          testid="kpi-reorder-alerts"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-md shadow-sm p-5">
          <p className="font-heading font-bold text-slate-900 mb-4">Production Trend — Last 6 Months</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthly_production_trend} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fontFamily: 'JetBrains Mono' }} />
              <YAxis tick={{ fontSize: 11, fontFamily: 'JetBrains Mono' }} />
              <Tooltip contentStyle={{ fontFamily: 'Inter', fontSize: 12, borderRadius: 4, border: '1px solid #e2e8f0' }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="produced" name="Produced" fill="#EA580C" radius={[2, 2, 0, 0]} />
              <Bar dataKey="rejected" name="Rejected" fill="#fca5a5" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Reorder Alerts */}
        <div className="bg-white border border-slate-200 rounded-md shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-amber-500" />
            <p className="font-heading font-bold text-slate-900">Reorder Alerts</p>
          </div>
          {reorder_items.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">All stock levels are adequate</p>
          ) : (
            <div className="space-y-2" data-testid="reorder-list">
              {reorder_items.map(item => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="text-xs font-medium text-slate-800">{item.item_name}</p>
                    <p className="text-xs text-slate-400 font-mono">{item.item_id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono font-semibold text-red-600">{Number(item.current_stock).toFixed(2)}</p>
                    <p className="text-xs text-slate-400">{item.unit}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model-wise this month */}
        <div className="bg-white border border-slate-200 rounded-md shadow-sm p-5">
          <p className="font-heading font-bold text-slate-900 mb-4">
            This Month — Model Wise
          </p>
          {current_month_model_wise.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No production this month</p>
          ) : (
            <div className="table-scroll">
              <table className="data-table w-full">
                <thead><tr>
                  <th>Model</th>
                  <th className="text-right">Produced</th>
                  <th className="text-right">Rejected</th>
                  <th className="text-right">Net</th>
                </tr></thead>
                <tbody>
                  {current_month_model_wise.map(m => (
                    <tr key={m.model_id}>
                      <td className="font-medium">{m.model_name}</td>
                      <td className="text-right font-mono">{m.produced}</td>
                      <td className="text-right font-mono text-red-500">{m.rejected}</td>
                      <td className="text-right font-mono font-semibold text-emerald-600">{m.net}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top consumed materials */}
        <div className="bg-white border border-slate-200 rounded-md shadow-sm p-5">
          <p className="font-heading font-bold text-slate-900 mb-4">Top Consumed Materials</p>
          {top_consumed_materials.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No production data this month</p>
          ) : (
            <div className="space-y-2" data-testid="top-materials">
              {top_consumed_materials.slice(0, 6).map((m, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="text-xs font-medium text-slate-800">{m.raw_material__item_name}</p>
                    <p className="text-xs text-slate-400">{m.raw_material__unit}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono font-semibold">{Number(m.total_qty).toFixed(2)}</p>
                    <p className="text-xs text-slate-400 font-mono">₹{Number(m.total_cost).toFixed(0)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
