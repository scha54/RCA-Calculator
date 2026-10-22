import React from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  Legend,
} from 'recharts';

interface RadarDataPoint {
  label: string;
  central: number;
  low: number;
  high: number;
}

interface RadarProfileProps {
  data: RadarDataPoint[];
  scenarioName: string;
}

export const RadarProfile: React.FC<RadarProfileProps> = ({ data, scenarioName }) => {
  const chartData = data.map(d => ({
    dimension: d.label,
    central: Math.round(d.central * 10) / 10,
    low: Math.round(d.low * 10) / 10,
    high: Math.round(d.high * 10) / 10,
  }));

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col items-center">
      <div className="w-full flex items-center justify-between mb-2">
        <div>
          <h3 className="text-base font-bold text-slate-100">
            Circularity Profile Radar (0 – 100 Index)
          </h3>
          <p className="text-xs text-slate-400">
            Performance across Slowing, Closing, Life Cycle, and Systems
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
          {scenarioName}
        </span>
      </div>

      <div className="w-full h-80 sm:h-96">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
            <PolarGrid stroke="#334155" />
            <PolarAngleAxis
              dataKey="dimension"
              tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={{ fill: '#64748b', fontSize: 10 }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-xl text-xs">
                    <p className="font-bold text-emerald-400 mb-1">{d.dimension}</p>
                    <p className="text-slate-200">
                      Central Score: <span className="font-semibold text-white">{d.central} / 100</span>
                    </p>
                    <p className="text-slate-400">
                      Uncertainty Band: [{d.low} – {d.high}]
                    </p>
                  </div>
                );
              }}
            />
            {/* Uncertainty Upper Envelope */}
            <Radar
              name="Upper Uncertainty (+)"
              dataKey="high"
              stroke="#0d9488"
              fill="#0d9488"
              fillOpacity={0.15}
            />
            {/* Central Score */}
            <Radar
              name="Central Circularity Score"
              dataKey="central"
              stroke="#10b981"
              strokeWidth={2.5}
              fill="#10b981"
              fillOpacity={0.4}
            />
            {/* Uncertainty Lower Bound */}
            <Radar
              name="Lower Uncertainty (-)"
              dataKey="low"
              stroke="#059669"
              fill="#059669"
              fillOpacity={0.2}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              formatter={value => <span className="text-slate-300 font-medium">{value}</span>}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
