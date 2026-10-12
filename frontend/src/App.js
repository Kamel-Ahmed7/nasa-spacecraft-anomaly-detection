import React, { useState, useEffect } from "react";
import {
  Rocket,
  Activity,
  Server,
  Download,
  AlertOctagon,
  Clock,
  Database,
} from "lucide-react";
import axios from "axios";
import UploadChannel from "./components/UploadChannel";
import MetricsSummary from "./components/MetricsSummary";
import TelemetryChart from "./components/TelemetryChart";

// تنظيف الروابط أوتوماتيك وحماية من أي Trailing Slash
// تعريف الرابط مباشرة بطريقة تضمن عدم فشله أبداً
const getCleanApiUrl = () => {
  // لو متغير البيئة موجود هياخده، لو مش موجود هيثبت رابط ريلواي فوراً
  let url = process.env.REACT_APP_API_URL || "https://nasa-spacecraft-anomaly-detection-production.up.railway.app";
  if (url.endsWith("/")) {
    url = url.slice(0, -1);
  }
  return url;
};

const API_BASE_URL = `${getCleanApiUrl()}/api`;

const API_BASE_URL = `${getCleanApiUrl()}/api`;

export default function App() {
  const [predictionResults, setPredictionResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState("checking");
  const [utcTime, setUtcTime] = useState("");

  // Live UTC Clock
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setUtcTime(now.toUTCString().replace("GMT", "UTC"));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Health Check Backend with Retries (Cold Start Protection) & Pre-load T-1.npy
  // Health Check Backend with Retries & Flexible Status Check
  useEffect(() => {
    let isMounted = true;

    const checkHealthWithRetries = async (retries = 3, delay = 2000) => {
      for (let i = 0; i < retries; i++) {
        try {
          const res = await axios.get(`${API_BASE_URL}/health`, { timeout: 8000 });
          // لو السيرفر رد بأي بيانات، نعتبره أونلاين فوراً!
          if (res.data) {
            if (isMounted) setBackendStatus("online");
            return;
          }
        } catch (err) {
          console.warn(`Health check attempt ${i + 1} failed. Retrying...`, err);
          if (i < retries - 1) {
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      }
      if (isMounted) setBackendStatus("offline");
    };

    checkHealthWithRetries();
    // ... باقي الـ useEffect

    // Auto-load benchmark channel on mount
    setIsLoading(true);
    axios
      .post(`${API_BASE_URL}/sample/T-1.npy`)
      .then((res) => {
        if (isMounted) setPredictionResults(res.data);
      })
      .catch((err) => {
        console.warn("Could not pre-load sample channel T-1", err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const exportReport = () => {
    if (!predictionResults) return;
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(predictionResults, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `nasa_telemetry_anomaly_report_${predictionResults.filename || "channel"}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="min-h-screen text-gray-100 flex flex-col selection:bg-space-cyan selection:text-black">
      {/* Top Navbar Header */}
      <header className="glass-panel border-b border-space-border/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-space-cyan to-space-blue p-0.5 flex items-center justify-center shadow-cyan-glow">
              <div className="w-full h-full bg-space-dark rounded-[10px] flex items-center justify-center">
                <Rocket className="w-5 h-5 text-space-cyan" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-extrabold text-white tracking-wider font-mono">
                  NASA TELEMETRY ANOMALY DETECTION
                </h1>
                <span className="bg-space-card text-space-cyan text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-space-cyan/30">
                  SMAP / MSL ML PIPELINE
                </span>
              </div>
              <p className="text-xs text-space-muted">
                XGBoost End-to-End Pipeline • 304 Features (250 Statistical + 54
                Spacecraft Channel Encodings)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Live Clock */}
            <div className="hidden md:flex items-center space-x-1.5 text-xs font-mono text-space-muted bg-space-card/80 px-3 py-1.5 rounded-lg border border-space-border">
              <Clock className="w-3.5 h-3.5 text-space-cyan" />
              <span>{utcTime || "SYS TIME UTC"}</span>
            </div>

            {/* Backend Status Indicator */}
            <div className="flex items-center space-x-2 bg-space-card/80 px-3 py-1.5 rounded-lg border border-space-border text-xs font-mono">
              <Server className="w-3.5 h-3.5 text-space-cyan" />
              {backendStatus === "online" ? (
                <span className="text-space-green font-bold flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-space-green animate-pulse"></span>
                  <span>BACKEND ONLINE</span>
                </span>
              ) : backendStatus === "offline" ? (
                <span className="text-space-red font-bold flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-space-red"></span>
                  <span>BACKEND OFFLINE</span>
                </span>
              ) : (
                <span className="text-space-amber font-bold animate-pulse">
                  CHECKING STATUS...
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow space-y-8 w-full">
        {/* Step 1: Upload / Channel Selector */}
        <section>
          <UploadChannel
            onPredictionResult={(data) => setPredictionResults(data)}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        </section>

        {/* Step 2: System KPI Diagnostics */}
        {predictionResults && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-space-cyan" />
                <h2 className="text-lg font-bold text-white font-mono tracking-wide">
                  MISSION DIAGNOSTIC METRICS
                </h2>
              </div>

              <button
                type="button"
                onClick={exportReport}
                className="flex items-center space-x-2 px-3.5 py-1.5 bg-space-card hover:bg-space-border text-space-cyan border border-space-cyan/30 rounded-lg text-xs font-mono transition-all hover:shadow-cyan-glow"
              >
                <Download className="w-4 h-4" />
                <span>EXPORT REPORT (JSON)</span>
              </button>
            </div>

            <MetricsSummary results={predictionResults} />
          </section>
        )}

        {/* Step 3: Interactive Time-Series Telemetry Chart */}
        <section>
          <TelemetryChart results={predictionResults} />
        </section>

        {/* Step 4: Detailed Anomaly Sequence Table */}
        {predictionResults &&
          predictionResults.anomaly_sequences &&
          predictionResults.anomaly_sequences.length > 0 && (
            <section className="glass-panel rounded-2xl p-6 border border-space-border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-space-red/10 border border-space-red/30 rounded-xl text-space-red">
                    <AlertOctagon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white tracking-wide font-mono">
                      DETECTED ANOMALY SEQUENCES (
                      {predictionResults.anomaly_sequences.length})
                    </h3>
                    <p className="text-xs text-space-muted">
                      Exact time window intervals identified with anomalous
                      telemetry behavior
                    </p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="border-b border-space-border text-space-muted bg-space-card/50">
                      <th className="py-3 px-4">SEQUENCE #</th>
                      <th className="py-3 px-4">START SAMPLE</th>
                      <th className="py-3 px-4">END SAMPLE</th>
                      <th className="py-3 px-4">INTERVAL DURATION</th>
                      <th className="py-3 px-4">CONFIDENCE SCORE</th>
                      <th className="py-3 px-4">SEVERITY STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-space-border/50 text-gray-200">
                    {predictionResults.anomaly_sequences.map((seq, idx) => {
                      const duration = seq.end - seq.start;
                      const isHighSeverity = seq.confidence >= 0.85;

                      return (
                        <tr
                          key={idx}
                          className="hover:bg-space-card/40 transition-colors"
                        >
                          <td className="py-3 px-4 font-bold text-space-cyan">
                            SEQ-{(idx + 1).toString().padStart(2, "0")}
                          </td>
                          <td className="py-3 px-4">#{seq.start}</td>
                          <td className="py-3 px-4">#{seq.end}</td>
                          <td className="py-3 px-4">{duration} samples</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <div className="w-16 bg-space-dark rounded-full h-1.5 overflow-hidden border border-space-border">
                                <div
                                  className={`h-full ${
                                    isHighSeverity ? "bg-space-red" : "bg-space-amber"
                                  }`}
                                  style={{ width: `${seq.confidence * 100}%` }}
                                ></div>
                              </div>
                              <span>{(seq.confidence * 100).toFixed(1)}%</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {isHighSeverity ? (
                              <span className="px-2.5 py-1 rounded bg-space-red/15 text-space-red border border-space-red/40 font-bold text-[10px]">
                                HIGH ANOMALY
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded bg-space-amber/15 text-space-amber border border-space-amber/40 font-bold text-[10px]">
                                MODERATE
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}
      </main>

      {/* Footer */}
      <footer className="glass-panel border-t border-space-border/80 mt-12 py-6 text-xs text-space-muted font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-space-cyan" />
            <span>NASA SMAP / MSL Telemetry Anomaly Benchmark Dataset</span>
          </div>
          <div>
            FastAPI Backend • React.js Tailwind CSS Dashboard • XGBoost ML
            Pipeline
          </div>
        </div>
      </footer>
    </div>
  );
}