// Charts.jsx - Fixed for Netlify Deployment
// ========== FIXED VERSION ==========

import { useState, useMemo, useEffect } from "react";

import {
  Chart as ChartJS,
  LineElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

import { Line, Bar } from "react-chartjs-2";

// ========== 🎛️ ALL CONFIGURABLE VARIABLES ==========

// -------------------- CHART DISPLAY SETTINGS --------------------
const DEFAULT_DURATION = 60;
const CHART_HEIGHT = 280;
const POINT_RADIUS = 2;
const POINT_HOVER_RADIUS = 5;
const CHART_TENSION = 0.3;

// -------------------- CURRENT THRESHOLDS --------------------
const CURRENT_WARNING_LIMIT = 10;
const CURRENT_CRITICAL_LIMIT = 13;
const CURRENT_OVERLOAD_POINT = 12;

// -------------------- TEMPERATURE THRESHOLDS --------------------
const TEMP_WARNING_LIMIT = 40;
const TEMP_CRITICAL_LIMIT = 55;
const TEMP_OVERHEAT_POINT = 45;

// -------------------- FLOW THRESHOLDS --------------------
const FLOW_DIFF_WARNING = 3.0;
const FLOW_DIFF_CRITICAL = 5.0;

// -------------------- EFFICIENCY THRESHOLDS --------------------
const EFFICIENCY_GOOD = 0.8;
const EFFICIENCY_WARNING = 0.5;
const HIGH_CURRENT_THRESHOLD = 10;
const LOW_FLOW_THRESHOLD = 8;

// -------------------- STATS CARD SETTINGS --------------------
const SHOW_STATS_CARDS = true;
const STATS_REFRESH_ANIMATION = true;

// -------------------- ANALYSIS PANEL SETTINGS --------------------
const DEFAULT_SHOW_ANALYSIS = true;
const SHOW_SEVERITY_BORDERS = true;

// -------------------- TIME WINDOW OPTIONS --------------------
const TIME_WINDOWS = [
  { label: "Last 5 Minutes", value: 5 },
  { label: "Last 1 Hour", value: 60 },
  { label: "Last 5 Hours", value: 300 },
  { label: "Last 10 Hours", value: 600 },
  { label: "Last 24 Hours", value: 1440 },
  { label: "Last 7 Days", value: 10080 },
];

// -------------------- CHART COLORS --------------------
const COLORS = {
  current: "#00f5d4",
  currentBg: "rgba(0, 245, 212, 0.05)",
  temperature: "#ff6b6b",
  temperatureBg: "rgba(255, 107, 107, 0.05)",
  flow1: "rgba(32, 201, 151, 0.7)",
  flow2: "rgba(132, 94, 247, 0.7)",
  load: "#339af0",
  loadBg: "rgba(51, 154, 240, 0.1)",
  tank: "#f59f00",
  tankBg: "rgba(245, 159, 0, 0.1)",
  vibration: "#ff4d4f",
  vibrationBg: "rgba(255, 77, 79, 0.1)",
  warning: "rgba(255, 193, 7, 0.8)",
  alert: "red",
  overheat: "orange",
};

// -------------------- ALERT MESSAGES --------------------
const ALERT_MESSAGES = {
  currentCritical: "CRITICAL: Reduce load immediately!",
  currentWarning: "High current draw - monitor closely",
  currentAboveAvg: "Current above average - check for issues",
  tempCritical: "CRITICAL: Overheating! Check cooling!",
  tempWarning: "High temperature - check ventilation",
  tempRising: "Temperature rising - monitor trend",
  leakageCritical: "MAJOR LEAKAGE suspected! Inspect pipes!",
  leakageWarning: "Possible leakage - check connections",
  leakageIncreasing: "Flow difference increasing - monitor",
  efficiencyCritical: "High current, low flow - Check for blockage!",
  efficiencyWarning: "Efficiency low - possible wear or blockage",
  efficiencyLow: "Efficiency below optimal - schedule check",
};

// ========== REGISTER CHART.JS COMPONENTS (CRITICAL FIX) ==========
// Register ALL components before using them
ChartJS.register(
  LineElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Filler,
);

export default function Charts({ data }) {
  const [duration, setDuration] = useState(DEFAULT_DURATION);
  const [showAnalysis, setShowAnalysis] = useState(DEFAULT_SHOW_ANALYSIS);
  const [isMounted, setIsMounted] = useState(false);

  // Fix for hydration/SSR issues with Netlify
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Safe and sorted data
  const safeData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data
      .map((d) => ({ ...d, TS: Number(d.TS) || 0 }))
      .filter((d) => d.TS > 0)
      .sort((a, b) => a.TS - b.TS);
  }, [data]);

  // Show loading state while mounting
  if (!isMounted) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-900 rounded-xl">
        <div className="text-center text-gray-400">
          <div className="text-4xl mb-2">📊</div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (safeData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-900 rounded-xl">
        <div className="text-center text-gray-400">
          <div className="text-4xl mb-2">📊</div>
          <p>No Data Available</p>
          <p className="text-sm mt-1">Waiting for sensor data...</p>
        </div>
      </div>
    );
  }

  const now = safeData[safeData.length - 1].TS;
  const filteredData = safeData.filter(
    (d) => now - d.TS <= duration * 60 * 1000,
  );

  if (filteredData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-900 rounded-xl">
        <div className="text-center text-gray-400">
          <div className="text-4xl mb-2">⏱️</div>
          <p>No data in selected time window</p>
          <p className="text-sm mt-1">Try increasing the time range</p>
        </div>
      </div>
    );
  }

  const labels = filteredData.map((d) => {
    const date = new Date(d.TS);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  });

  const get = (key) => filteredData.map((d) => Number(d[key]) || 0);

  const insights = calculateInsights(filteredData);

  const load = filteredData.map(
    (d) =>
      (Number(d.Flow1 || 0) + Number(d.Flow2 || 0)) / (Number(d.Current) || 1),
  );

  const currentData = get("Current");
  const tempData = get("Temperature");

  const overloadPoints = currentData.map((v) =>
    v > CURRENT_OVERLOAD_POINT ? v : null,
  );
  const overheatPoints = tempData.map((v) =>
    v > TEMP_OVERHEAT_POINT ? v : null,
  );

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { labels: { color: "#ddd", font: { size: 11 } } },
      tooltip: {
        mode: "index",
        intersect: false,
        backgroundColor: "rgba(0,0,0,0.8)",
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || "";
            let value = context.raw;
            if (value !== null && value !== undefined) {
              label += `: ${value.toFixed(2)}`;
              if (context.dataset.label === "Temperature") label += "°C";
              if (context.dataset.label === "Current") label += "A";
              if (context.dataset.label?.includes("Flow")) label += " L/min";
            }
            return label;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: "#aaa", maxRotation: 45, minRotation: 45 },
        grid: { color: "rgba(255,255,255,0.05)" },
      },
      y: {
        ticks: { color: "#aaa" },
        grid: { color: "rgba(255,255,255,0.05)" },
      },
    },
  };

  return (
    <div className="space-y-6 bg-gray-900 min-h-screen p-6">
      {/* Header with Controls */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-4 backdrop-blur border border-white/10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              📈 Real-Time Monitoring Dashboard
            </h3>
            <p className="text-gray-400 text-sm mt-1">
              {filteredData.length} data points | Last update:{" "}
              {new Date(now).toLocaleTimeString()}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm cursor-pointer hover:bg-gray-700 transition"
            >
              {TIME_WINDOWS.map((window) => (
                <option key={window.value} value={window.value}>
                  {window.label}
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowAnalysis(!showAnalysis)}
              className="px-3 py-2 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-300 text-sm hover:bg-purple-500/30 transition"
            >
              {showAnalysis ? "📊 Hide Analysis" : "🔍 Show Analysis"}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats Cards */}
      {SHOW_STATS_CARDS && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <StatCard
            title="Current"
            value={`${currentData[currentData.length - 1]?.toFixed(1) || 0}A`}
            status={
              currentData[currentData.length - 1] > CURRENT_WARNING_LIMIT
                ? "warning"
                : "normal"
            }
            icon="⚡"
            animation={STATS_REFRESH_ANIMATION}
          />
          <StatCard
            title="Temperature"
            value={`${tempData[tempData.length - 1]?.toFixed(1) || 0}°C`}
            status={
              tempData[tempData.length - 1] > TEMP_WARNING_LIMIT
                ? "warning"
                : "normal"
            }
            icon="🌡️"
            animation={STATS_REFRESH_ANIMATION}
          />
          <StatCard
            title="Flow1"
            value={`${get("Flow1")[get("Flow1").length - 1]?.toFixed(1) || 0} L/min`}
            icon="🚰"
            animation={STATS_REFRESH_ANIMATION}
          />
          <StatCard
            title="Flow2"
            value={`${get("Flow2")[get("Flow2").length - 1]?.toFixed(1) || 0} L/min`}
            icon="💧"
            animation={STATS_REFRESH_ANIMATION}
          />
          <StatCard
            title="Tank Height"
            value={`${get("TankHeight")[get("TankHeight").length - 1]?.toFixed(1) || 0}m`}
            icon="🛢️"
            animation={STATS_REFRESH_ANIMATION}
          />
          <StatCard
            title="Vibration"
            value={
              get("Vibration")[get("Vibration").length - 1] === 1
                ? "ALERT"
                : "OK"
            }
            status={
              get("Vibration")[get("Vibration").length - 1] === 1
                ? "critical"
                : "normal"
            }
            icon="📳"
            animation={STATS_REFRESH_ANIMATION}
          />
        </div>
      )}

      {/* Analysis Insights Panel */}
      {showAnalysis && (
        <div className="bg-gradient-to-r from-green-500/5 to-blue-500/5 rounded-xl p-4 border border-green-500/20">
          <h4 className="font-bold text-green-400 mb-3 flex items-center gap-2">
            <span>🔍</span> Real-Time Analysis Insights
            <span className="text-xs text-gray-500 ml-2">
              (Thresholds: Current&gt;{CURRENT_WARNING_LIMIT}A | Temp&gt;
              {TEMP_WARNING_LIMIT}°C)
            </span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <InsightCard
              title="Current Status"
              value={insights.currentStatus?.value || "N/A"}
              status={insights.currentStatus?.status || "normal"}
              recommendation={
                insights.currentStatus?.recommendation || "No data"
              }
              icon="⚡"
              thresholds={`Warning: ${CURRENT_WARNING_LIMIT}A | Critical: ${CURRENT_CRITICAL_LIMIT}A`}
            />
            <InsightCard
              title="Temperature Status"
              value={insights.tempStatus?.value || "N/A"}
              status={insights.tempStatus?.status || "normal"}
              recommendation={insights.tempStatus?.recommendation || "No data"}
              icon="🌡️"
              thresholds={`Warning: ${TEMP_WARNING_LIMIT}°C | Critical: ${TEMP_CRITICAL_LIMIT}°C`}
            />
            <InsightCard
              title="Flow Difference"
              value={insights.flowDiff?.value || "N/A"}
              status={insights.flowDiff?.status || "normal"}
              recommendation={insights.flowDiff?.recommendation || "No data"}
              icon="💧"
              thresholds={`Warning: ${FLOW_DIFF_WARNING} L/min | Critical: ${FLOW_DIFF_CRITICAL} L/min`}
            />
            <InsightCard
              title="Pump Efficiency"
              value={insights.efficiency?.value || "N/A"}
              status={insights.efficiency?.status || "normal"}
              recommendation={insights.efficiency?.recommendation || "No data"}
              icon="⚙️"
              thresholds={`Good > ${EFFICIENCY_GOOD} | Warning < ${EFFICIENCY_WARNING}`}
            />
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Current Chart */}
        <ChartCard
          title="⚡ Current Draw"
          subtitle={`Amperes (A) - Warning > ${CURRENT_WARNING_LIMIT}A | Critical > ${CURRENT_CRITICAL_LIMIT}A`}
          severity="high"
          showBorder={SHOW_SEVERITY_BORDERS}
        >
          <Line
            data={{
              labels,
              datasets: [
                {
                  label: "Current",
                  data: currentData,
                  borderColor: COLORS.current,
                  backgroundColor: COLORS.currentBg,
                  fill: true,
                  tension: CHART_TENSION,
                  pointRadius: POINT_RADIUS,
                  pointHoverRadius: POINT_HOVER_RADIUS,
                },
                {
                  label: `Warning Limit (${CURRENT_WARNING_LIMIT}A)`,
                  data: new Array(labels.length).fill(CURRENT_WARNING_LIMIT),
                  borderColor: COLORS.warning,
                  borderDash: [6, 4],
                  pointRadius: 0,
                  fill: false,
                },
                {
                  label: "Overload Events",
                  data: overloadPoints,
                  pointBackgroundColor: COLORS.alert,
                  pointRadius: POINT_HOVER_RADIUS,
                  pointHoverRadius: POINT_HOVER_RADIUS + 3,
                  showLine: false,
                  type: "scatter",
                },
              ],
            }}
            options={chartOptions}
          />
        </ChartCard>

        {/* Temperature Chart */}
        <ChartCard
          title="🌡️ Temperature"
          subtitle={`Degrees Celsius (°C) - Warning > ${TEMP_WARNING_LIMIT}°C | Critical > ${TEMP_CRITICAL_LIMIT}°C`}
          severity="high"
          showBorder={SHOW_SEVERITY_BORDERS}
        >
          <Line
            data={{
              labels,
              datasets: [
                {
                  label: "Temperature",
                  data: tempData,
                  borderColor: COLORS.temperature,
                  backgroundColor: COLORS.temperatureBg,
                  fill: true,
                  tension: CHART_TENSION,
                  pointRadius: POINT_RADIUS,
                },
                {
                  label: `Warning Limit (${TEMP_WARNING_LIMIT}°C)`,
                  data: new Array(labels.length).fill(TEMP_WARNING_LIMIT),
                  borderColor: COLORS.warning,
                  borderDash: [6, 4],
                  pointRadius: 0,
                },
                {
                  label: "Overheat Events",
                  data: overheatPoints,
                  pointBackgroundColor: COLORS.overheat,
                  pointRadius: POINT_HOVER_RADIUS,
                  showLine: false,
                },
              ],
            }}
            options={chartOptions}
          />
        </ChartCard>

        {/* Flow Comparison Chart */}
        <ChartCard
          title="🚰 Flow Comparison"
          subtitle={`Flow Rate (L/min) - Leakage warning if difference > ${FLOW_DIFF_WARNING} L/min`}
          severity="medium"
          showBorder={SHOW_SEVERITY_BORDERS}
        >
          <Bar
            data={{
              labels,
              datasets: [
                {
                  label: "Flow 1 (Inlet)",
                  data: get("Flow1"),
                  backgroundColor: COLORS.flow1,
                  borderRadius: 4,
                },
                {
                  label: "Flow 2 (Outlet)",
                  data: get("Flow2"),
                  backgroundColor: COLORS.flow2,
                  borderRadius: 4,
                },
              ],
            }}
            options={chartOptions}
          />
        </ChartCard>

        {/* Load Chart */}
        <ChartCard
          title="⚙️ Pump Load"
          subtitle="Load Factor (Flow/Current) - Higher is better"
          severity="medium"
          showBorder={SHOW_SEVERITY_BORDERS}
        >
          <Line
            data={{
              labels,
              datasets: [
                {
                  label: "Load",
                  data: load,
                  borderColor: COLORS.load,
                  backgroundColor: COLORS.loadBg,
                  fill: true,
                  tension: CHART_TENSION,
                  pointRadius: POINT_RADIUS,
                },
              ],
            }}
            options={chartOptions}
          />
        </ChartCard>

        {/* Tank Height Chart */}
        <ChartCard
          title="🛢️ Tank Level"
          subtitle="Height (meters)"
          severity="low"
          showBorder={SHOW_SEVERITY_BORDERS}
        >
          <Line
            data={{
              labels,
              datasets: [
                {
                  label: "Tank Height",
                  data: get("TankHeight"),
                  borderColor: COLORS.tank,
                  backgroundColor: COLORS.tankBg,
                  fill: true,
                  tension: CHART_TENSION,
                  pointRadius: POINT_RADIUS,
                },
              ],
            }}
            options={chartOptions}
          />
        </ChartCard>

        {/* Vibration Chart */}
        <ChartCard
          title="📳 Vibration"
          subtitle="Status (0=OK, 1=Alert) - Any alert indicates mechanical issue"
          severity="high"
          showBorder={SHOW_SEVERITY_BORDERS}
        >
          <Line
            data={{
              labels,
              datasets: [
                {
                  label: "Vibration",
                  data: get("Vibration"),
                  borderColor: COLORS.vibration,
                  backgroundColor: COLORS.vibrationBg,
                  stepped: true,
                  pointRadius: POINT_RADIUS + 1,
                  pointBorderColor: COLORS.vibration,
                },
              ],
            }}
            options={chartOptions}
          />
        </ChartCard>
      </div>

      {/* Summary Footer */}
      <div className="bg-gray-800/50 rounded-xl p-4 text-center text-gray-400 text-xs">
        <p>
          ⚠️ Colored markers indicate alert conditions | Dashed lines show
          warning thresholds | Hover on charts for detailed values
        </p>
        <p className="mt-1">
          ⚙️ Configurable thresholds: Current({CURRENT_WARNING_LIMIT}A) |
          Temperature({TEMP_WARNING_LIMIT}°C) | Flow Diff({FLOW_DIFF_WARNING}
          L/min)
        </p>
      </div>
    </div>
  );
}

// ========== HELPER COMPONENTS ==========

function StatCard({ title, value, status = "normal", icon, animation = true }) {
  const getStatusColor = () => {
    switch (status) {
      case "critical":
        return "text-red-400 border-red-500/50 bg-red-500/10";
      case "warning":
        return "text-yellow-400 border-yellow-500/50 bg-yellow-500/10";
      default:
        return "text-green-400 border-green-500/30 bg-green-500/5";
    }
  };

  return (
    <div
      className={`rounded-xl p-3 border backdrop-blur ${animation ? "transition-all hover:scale-105" : ""} ${getStatusColor()}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        <span className="text-xs opacity-70">{title}</span>
      </div>
      <div className="text-xl font-bold mt-1">{value}</div>
    </div>
  );
}

function ChartCard({ title, subtitle, severity, children, showBorder = true }) {
  const getBorderColor = () => {
    if (!showBorder) return "border-white/10";
    switch (severity) {
      case "high":
        return "border-red-500/30";
      case "medium":
        return "border-yellow-500/30";
      default:
        return "border-blue-500/30";
    }
  };

  return (
    <div
      className={`bg-gray-800/30 rounded-xl p-4 border ${getBorderColor()} transition-all hover:shadow-lg`}
    >
      <div className="mb-3">
        <h4 className="font-bold text-white">{title}</h4>
        <p className="text-xs text-gray-400">{subtitle}</p>
      </div>
      <div style={{ height: `${CHART_HEIGHT}px` }}>{children}</div>
    </div>
  );
}

function InsightCard({
  title,
  value,
  status,
  recommendation,
  icon,
  thresholds,
}) {
  const getStatusColor = () => {
    switch (status) {
      case "critical":
        return "text-red-400";
      case "warning":
        return "text-yellow-400";
      case "good":
        return "text-green-400";
      default:
        return "text-gray-400";
    }
  };

  const getBgColor = () => {
    switch (status) {
      case "critical":
        return "bg-red-500/10 border-red-500/20";
      case "warning":
        return "bg-yellow-500/10 border-yellow-500/20";
      case "good":
        return "bg-green-500/10 border-green-500/20";
      default:
        return "bg-gray-500/10 border-gray-500/20";
    }
  };

  return (
    <div className={`rounded-lg p-3 border ${getBgColor()}`}>
      <div className="flex items-center gap-2 mb-2">
        <span>{icon}</span>
        <span className="text-xs text-gray-300">{title}</span>
      </div>
      <div className={`text-lg font-bold ${getStatusColor()}`}>{value}</div>
      <div className="text-xs text-gray-400 mt-1">{recommendation}</div>
      {thresholds && (
        <div className="text-xs text-gray-500 mt-2 font-mono border-t border-gray-700 pt-1">
          {thresholds}
        </div>
      )}
    </div>
  );
}

// ========== ANALYSIS CALCULATIONS ==========

function calculateInsights(data) {
  if (!data.length) return {};

  const latest = data[data.length - 1];
  const avgCurrent =
    data.reduce((a, b) => a + (b.Current || 0), 0) / data.length;
  const avgTemp =
    data.reduce((a, b) => a + (b.Temperature || 0), 0) / data.length;
  const avgFlowDiff =
    data.reduce((a, b) => a + Math.abs((b.Flow1 || 0) - (b.Flow2 || 0)), 0) /
    data.length;

  // Current Status
  let currentStatus = {
    value: `${(latest.Current || 0).toFixed(1)}A`,
    status: "normal",
    recommendation: "",
  };
  if ((latest.Current || 0) > CURRENT_CRITICAL_LIMIT) {
    currentStatus.status = "critical";
    currentStatus.recommendation = ALERT_MESSAGES.currentCritical;
  } else if ((latest.Current || 0) > CURRENT_WARNING_LIMIT) {
    currentStatus.status = "warning";
    currentStatus.recommendation = ALERT_MESSAGES.currentWarning;
  } else if ((latest.Current || 0) > avgCurrent * 1.2) {
    currentStatus.status = "warning";
    currentStatus.recommendation = ALERT_MESSAGES.currentAboveAvg;
  } else {
    currentStatus.recommendation = "Current draw normal";
  }

  // Temperature Status
  let tempStatus = {
    value: `${(latest.Temperature || 0).toFixed(1)}°C`,
    status: "normal",
    recommendation: "",
  };
  if ((latest.Temperature || 0) > TEMP_CRITICAL_LIMIT) {
    tempStatus.status = "critical";
    tempStatus.recommendation = ALERT_MESSAGES.tempCritical;
  } else if ((latest.Temperature || 0) > TEMP_WARNING_LIMIT) {
    tempStatus.status = "warning";
    tempStatus.recommendation = ALERT_MESSAGES.tempWarning;
  } else if ((latest.Temperature || 0) > avgTemp * 1.15) {
    tempStatus.status = "warning";
    tempStatus.recommendation = ALERT_MESSAGES.tempRising;
  } else {
    tempStatus.recommendation = "Temperature normal";
  }

  // Flow Difference (Leakage)
  const flowDiff = Math.abs((latest.Flow1 || 0) - (latest.Flow2 || 0));
  let flowStatus = {
    value: `${flowDiff.toFixed(1)} L/min`,
    status: "normal",
    recommendation: "",
  };
  if (flowDiff > FLOW_DIFF_CRITICAL) {
    flowStatus.status = "critical";
    flowStatus.recommendation = ALERT_MESSAGES.leakageCritical;
  } else if (flowDiff > FLOW_DIFF_WARNING) {
    flowStatus.status = "warning";
    flowStatus.recommendation = ALERT_MESSAGES.leakageWarning;
  } else if (flowDiff > avgFlowDiff * 1.5) {
    flowStatus.status = "warning";
    flowStatus.recommendation = ALERT_MESSAGES.leakageIncreasing;
  } else {
    flowStatus.recommendation = "Flow sensors consistent";
  }

  // Pump Efficiency
  const efficiency =
    ((latest.Flow1 || 0) + (latest.Flow2 || 0)) / (latest.Current || 0 || 1);
  let efficiencyStatus = {
    value: efficiency.toFixed(2),
    status: "normal",
    recommendation: "",
  };
  if (
    (latest.Current || 0) > HIGH_CURRENT_THRESHOLD &&
    (latest.Flow1 || 0) + (latest.Flow2 || 0) < LOW_FLOW_THRESHOLD
  ) {
    efficiencyStatus.status = "critical";
    efficiencyStatus.recommendation = ALERT_MESSAGES.efficiencyCritical;
  } else if (efficiency < EFFICIENCY_WARNING) {
    efficiencyStatus.status = "warning";
    efficiencyStatus.recommendation = ALERT_MESSAGES.efficiencyWarning;
  } else if (efficiency < EFFICIENCY_GOOD) {
    efficiencyStatus.status = "warning";
    efficiencyStatus.recommendation = ALERT_MESSAGES.efficiencyLow;
  } else {
    efficiencyStatus.recommendation = "Pump operating efficiently";
  }

  return {
    currentStatus,
    tempStatus,
    flowDiff: flowStatus,
    efficiency: efficiencyStatus,
  };
}
