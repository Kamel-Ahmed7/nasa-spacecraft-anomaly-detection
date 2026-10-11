import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceArea,
  Brush
} from 'recharts';
import { Activity, AlertCircle, Eye, EyeOff, ZoomIn } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    return (
      <div className="bg-space-dark/95 border border-space-border p-3 rounded-xl shadow-2xl backdrop-blur-md text-xs font-mono">
        <p className="text-space-cyan font-bold mb-1">SAMPLE INDEX: #{label}</p>
        <p className="text-white">
          TELEMETRY VALUE: <span className="text-space-green font-bold">{dataPoint.value.toFixed(4)}</span>
        </p>
        {dataPoint.isAnomaly && (
          <p className="text-space-red font-bold mt-1 animate-pulse">
            ⚠️ ANOMALY DETECTED (CONF: {(dataPoint.confidence * 100).toFixed(1)}%)
          </p>
        )}
      </div>
    );
  }
  return null;
};

export default function TelemetryChart({ results }) {
  const [showAnomalies, setShowAnomalies] = useState(true);

  const { primary_signal = [], window_predictions = [], anomaly_sequences = [] } = results || {};

  // Map anomaly confidence and flags per sample index
  const chartData = useMemo(() => {
    if (!primary_signal || primary_signal.length === 0) return [];

    const anomalyMap = new Array(primary_signal.length).fill(0);
    const confMap = new Array(primary_signal.length).fill(0);

    if (window_predictions && window_predictions.length > 0) {
      window_predictions.forEach(w => {
        if (w.is_anomaly) {
          for (let i = w.start; i < w.end && i < primary_signal.length; i++) {
            anomalyMap[i] = 1;
            confMap[i] = Math.max(confMap[i], w.confidence);
          }
        }
      });
    }

    const step = primary_signal.length > 8000 ? 2 : 1;
    const data = [];
    
    for (let i = 0; i < primary_signal.length; i += step) {
      data.push({
        index: i,
        value: primary_signal[i],
        isAnomaly: anomalyMap[i] === 1,
        confidence: confMap[i]
      });
    }

    return data;
  }, [primary_signal, window_predictions]);

  if (!results || primary_signal.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-12 border border-space-border text-center flex flex-col items-center justify-center min-h-[350px]">
        <Activity className="w-12 h-12 text-space-cyan/40 mb-3 animate-pulse" />
        <h3 className="text-base font-bold text-white font-mono">MISSION CONTROL MONITOR IDLE</h3>
        <p className="text-xs text-space-muted mt-1 max-w-md">
          Upload a telemetry .npy channel array or pick a benchmark NASA channel above to render live signal visualization & anomaly overlay.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl p-6 border border-space-border relative overflow-hidden">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-space-card border border-space-border rounded-xl text-space-cyan">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-wide font-mono">
              TELEMETRY TIME-SERIES SIGNAL
            </h3>
            <p className="text-xs text-space-muted">
              Continuous sensor data • {primary_signal.length.toLocaleString()} points • Red highlights indicate detected anomaly intervals
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Anomaly Highlight Overlay Toggle */}
          <button
            type="button"
            onClick={() => setShowAnomalies(!showAnomalies)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all ${
              showAnomalies
                ? 'border-space-red bg-space-red/15 text-space-red shadow-red-glow'
                : 'border-space-border bg-space-card text-space-muted hover:text-white'
            }`}
          >
            {showAnomalies ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{showAnomalies ? 'ANOMALY OVERLAY ON' : 'ANOMALY OVERLAY OFF'}</span>
          </button>
        </div>
      </div>

      {/* Recharts Container */}
      <div className="w-full h-[400px] mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 25 }}>
            <defs>
              <linearGradient id="signalGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00F0FF" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#00F0FF" stopOpacity={0.0}/>
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1F293D" vertical={false} />
            <XAxis
              dataKey="index"
              stroke="#64748B"
              tick={{ fill: '#8A99AD', fontSize: 11, fontFamily: 'JetBrains Mono' }}
              tickLine={false}
              label={{ value: 'Sample Step (Time)', position: 'insideBottom', offset: -15, fill: '#8A99AD', fontSize: 11 }}
            />
            <YAxis
              stroke="#64748B"
              tick={{ fill: '#8A99AD', fontSize: 11, fontFamily: 'JetBrains Mono' }}
              tickLine={false}
              domain={['auto', 'auto']}
              label={{ value: 'Telemetry Value', angle: -90, position: 'insideLeft', fill: '#8A99AD', fontSize: 11 }}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Render Anomaly Sequences as Red Shaded Reference Areas */}
            {showAnomalies &&
              anomaly_sequences.map((seq, idx) => (
                <ReferenceArea
                  key={idx}
                  x1={seq.start}
                  x2={seq.end}
                  fill="#FF3366"
                  fillOpacity={0.3}
                  stroke="#FF3366"
                  strokeOpacity={0.8}
                  strokeWidth={1}
                />
              ))}

            {/* Primary Telemetry Line */}
            <Line
              type="monotone"
              dataKey="value"
              stroke="#00F0FF"
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 5, fill: '#00F0FF', stroke: '#FFFFFF', strokeWidth: 2 }}
            />

            {/* Interactive Brush Zoom Slider */}
            <Brush
              dataKey="index"
              height={26}
              stroke="#00F0FF"
              fill="#151A28"
              tickFormatter={(val) => `#${val}`}
              startIndex={0}
              endIndex={chartData.length - 1}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend & Summary Footer */}
      <div className="mt-4 pt-3 border-t border-space-border/60 flex flex-wrap items-center justify-between text-xs font-mono text-space-muted gap-2">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-0.5 bg-space-cyan inline-block"></span>
            <span>Nominal Telemetry</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 bg-space-red/40 border border-space-red inline-block rounded-sm"></span>
            <span>Anomalous Region (Red Highlight)</span>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <ZoomIn className="w-3.5 h-3.5 text-space-cyan" />
          <span>Drag horizontal slider to zoom into temporal regions</span>
        </div>
      </div>
    </div>
  );
}
