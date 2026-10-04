'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

export default function PredictionsRadarPage() {
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPredictions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/autopilot/analysis/predictions');
      const data = await res.json();
      if (data.success) {
        setPredictions(data.predictions || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, []);

  // Mock forecast line chart data for visualization
  const revenueChartData = [
    { day: 'Day -6', actual: 2850, predicted: 2850 },
    { day: 'Day -5', actual: 3100, predicted: 3100 },
    { day: 'Day -4', actual: 2950, predicted: 2950 },
    { day: 'Day -3', actual: 3300, predicted: 3300 },
    { day: 'Day -2', actual: 3450, predicted: 3450 },
    { day: 'Yesterday', actual: 3400, predicted: 3400 },
    { day: 'Today', actual: 3400, predicted: 3400 },
    { day: 'Day +1', predicted: 3520 },
    { day: 'Day +2', predicted: 3650 },
    { day: 'Day +3', predicted: 3780 },
    { day: 'Day +4', predicted: 3910 },
    { day: 'Day +5', predicted: 4050 },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/autopilot"
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              Predictive Intelligence & Radar
            </h1>
            <p className="text-xs text-slate-500">
              Mathematical time-series forecasting (OLS Trend + Moving Averages)
            </p>
          </div>
        </div>

        <button
          onClick={fetchPredictions}
          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Trajectory Chart */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Revenue Trajectory Forecast (7-Day Baseline)
            </h3>
            <p className="text-xs text-slate-500">Historical Actuals vs Trend Projection</p>
          </div>
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
            +18% Projected Trend
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenueChartData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 3 }}
                name="Actual Revenue ($)"
              />
              <Line
                type="monotone"
                dataKey="predicted"
                stroke="#6366f1"
                strokeWidth={2}
                strokeDasharray="4 4"
                name="Projected Trend ($)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Predictions Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Active Metric Forecasts
          </h3>
          <span className="text-xs text-slate-400">Stored in Prediction Table</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase tracking-wider border-b font-semibold">
              <tr>
                <th className="py-3 px-4">Metric</th>
                <th className="py-3 px-4">Horizon</th>
                <th className="py-3 px-4">Projected Value</th>
                <th className="py-3 px-4">Confidence</th>
                <th className="py-3 px-4">Generated At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {predictions.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-3 px-4 font-mono font-medium">{p.metric}</td>
                  <td className="py-3 px-4 uppercase font-bold text-slate-500">{p.horizon}</td>
                  <td className="py-3 px-4 font-black">
                    {p.metric.includes('revenue')
                      ? `$${p.predicted.toLocaleString()}`
                      : p.metric.includes('risk') || p.metric.includes('rate')
                      ? `${(p.predicted * 100).toFixed(1)}%`
                      : p.predicted}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-emerald-600 font-bold">
                      {(p.confidence * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
