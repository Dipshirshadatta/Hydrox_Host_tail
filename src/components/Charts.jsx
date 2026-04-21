// Charts.jsx - No Time Window, Shows All Data
import { useState, useMemo } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine, ComposedChart, Area
} from 'recharts';

// ========== 🎛️ CONFIGURABLE VARIABLES ==========
const CHART_HEIGHT = 320;
const CURRENT_WARNING_LIMIT = 10;
const CURRENT_CRITICAL_LIMIT = 13;
const TEMP_WARNING_LIMIT = 40;
const TEMP_CRITICAL_LIMIT = 55;
const FLOW_DIFF_WARNING = 3.0;
const FLOW_DIFF_CRITICAL = 5.0;
const SHOW_STATS_CARDS = true;
const DEFAULT_SHOW_ANALYSIS = true;

const COLORS = {
  current: "#00f5d4",
  temperature: "#ff6b6b",
  flow1: "#20c997",
  flow2: "#845ef7",
  flowDiff: "#f59f00",
  load: "#339af0",
  tank: "#f59f00",
};

export default function Charts({ data }) {
  const [showAnalysis, setShowAnalysis] = useState(DEFAULT_SHOW_ANALYSIS);

  // Process all data (no time window filtering)
  const processedData = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return [];
    
    console.log("Raw data received:", data.length, "points");
    
    const processed = data
      .filter(d => d && d.TS)
      .map(d => {
        // Ensure timestamp is a number
        let timestamp = Number(d.TS);
        if (isNaN(timestamp)) {
          timestamp = new Date(d.TS).getTime();
        }
        
        // Skip invalid timestamps
        if (isNaN(timestamp) || timestamp <= 0) return null;
        
        // Safe number conversions
        const current = Number(d.Current) || 0;
        const temperature = Number(d.Temperature) || 0;
        const flow1 = Number(d.Flow1) || 0;
        const flow2 = Number(d.Flow2) || 0;
        const tankHeight = Number(d.TankHeight) || 0;
        const vibration = Number(d.Vibration) || 0;
        
        // Calculate flow difference
        const flowDiff = Math.abs(flow1 - flow2);
        
        // Calculate load with division by zero protection
        const load = current > 0 ? (flow1 + flow2) / current : 0;
        
        // Create date object for formatting
        const date = new Date(timestamp);
        
        return {
          timestamp: timestamp,
          date: date,
          time: date.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
          }),
          fullTime: date.toLocaleString(),
          current: current,
          temperature: temperature,
          flow1: flow1,
          flow2: flow2,
          flowDiff: flowDiff,
          tankHeight: tankHeight,
          vibration: vibration,
          load: load,
        };
      })
      .filter(d => d !== null)
      .sort((a, b) => a.timestamp - b.timestamp);
    
    console.log("Processed data:", processed.length, "points");
    if (processed.length > 0) {
      console.log("Time range:", new Date(processed[0].timestamp), "to", new Date(processed[processed.length-1].timestamp));
    }
    
    return processed;
  }, [data]);

  // Calculate statistics for display
  const stats = useMemo(() => {
    if (processedData.length === 0) return {};
    
    const latest = processedData[processedData.length - 1];
    const avgCurrent = processedData.reduce((sum, d) => sum + d.current, 0) / processedData.length;
    const maxCurrent = Math.max(...processedData.map(d => d.current));
    const minCurrent = Math.min(...processedData.map(d => d.current));
    
    const avgTemp = processedData.reduce((sum, d) => sum + d.temperature, 0) / processedData.length;
    const maxTemp = Math.max(...processedData.map(d => d.temperature));
    const minTemp = Math.min(...processedData.map(d => d.temperature));
    
    const avgFlowDiff = processedData.reduce((sum, d) => sum + d.flowDiff, 0) / processedData.length;
    const maxFlowDiff = Math.max(...processedData.map(d => d.flowDiff));
    
    const avgLoad = processedData.reduce((sum, d) => sum + d.load, 0) / processedData.length;
    
    return { 
      latest, 
      avgCurrent, maxCurrent, minCurrent,
      avgTemp, maxTemp, minTemp,
      avgFlowDiff, maxFlowDiff,
      avgLoad,
      dataPoints: processedData.length,
      timeRange: {
        start: processedData[0]?.date,
        end: processedData[processedData.length - 1]?.date
      }
    };
  }, [processedData]);

  // Show loading state
  if (processedData.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-900 rounded-xl">
        <div className="text-center text-gray-400">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-lg">No Data Available</p>
          <p className="text-sm mt-2">Waiting for sensor data...</p>
        </div>
      </div>
    );
  }

  const insights = calculateInsights(processedData, stats);

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl p-5 border border-white/10 backdrop-blur">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                📈 Industrial Monitoring Dashboard
              </h3>
              <p className="text-gray-400 text-sm mt-1">
                {processedData.length} data points | {stats.timeRange?.start?.toLocaleDateString()} {stats.timeRange?.start?.toLocaleTimeString()} - {stats.timeRange?.end?.toLocaleTimeString()}
              </p>
            </div>
            <button
              onClick={() => setShowAnalysis(!showAnalysis)}
              className="px-4 py-2 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-300 text-sm hover:bg-purple-500/30 transition"
            >
              {showAnalysis ? "📊 Hide Analysis" : "🔍 Show Analysis"}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {SHOW_STATS_CARDS && stats.latest && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard 
              title="Current" 
              value={`${stats.latest.current.toFixed(1)}A`}
              subtitle={`Avg: ${stats.avgCurrent?.toFixed(1)}A`}
              status={stats.latest.current > CURRENT_WARNING_LIMIT ? "warning" : "normal"} 
              icon="⚡" 
            />
            <StatCard 
              title="Temperature" 
              value={`${stats.latest.temperature.toFixed(1)}°C`}
              subtitle={`Avg: ${stats.avgTemp?.toFixed(1)}°C`}
              status={stats.latest.temperature > TEMP_WARNING_LIMIT ? "warning" : "normal"} 
              icon="🌡️" 
            />
            <StatCard 
              title="Flow 1 (Inlet)" 
              value={`${stats.latest.flow1.toFixed(1)} L/min`}
              subtitle={`Flow 2: ${stats.latest.flow2.toFixed(1)} L/min`}
              icon="🚰" 
            />
            <StatCard 
              title="Flow Difference" 
              value={`${stats.latest.flowDiff.toFixed(1)} L/min`}
              subtitle={`Max: ${stats.maxFlowDiff?.toFixed(1)} L/min`}
              status={stats.latest.flowDiff > FLOW_DIFF_WARNING ? "warning" : "normal"}
              icon="📊" 
            />
            <StatCard 
              title="Tank Level" 
              value={`${stats.latest.tankHeight.toFixed(1)}m`}
              icon="🛢️" 
            />
            <StatCard 
              title="Efficiency" 
              value={`${(stats.latest.load * 100).toFixed(0)}%`}
              subtitle={`Avg: ${(stats.avgLoad * 100).toFixed(0)}%`}
              status={stats.latest.load < 0.6 ? "warning" : "normal"}
              icon="⚙️" 
            />
          </div>
        )}

        {/* Analysis Panel */}
        {showAnalysis && (
          <div className="bg-gradient-to-r from-green-500/5 to-blue-500/5 rounded-xl p-5 border border-green-500/20">
            <h4 className="font-bold text-green-400 mb-4 flex items-center gap-2">
              <span className="text-xl">🔍</span> Real-Time Analysis Insights
              <span className="text-xs text-gray-500 ml-2 font-normal">
                (Based on {processedData.length} data points)
              </span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <InsightCard 
                title="Current Status" 
                value={insights.currentStatus?.value || "N/A"}
                status={insights.currentStatus?.status || "normal"} 
                message={insights.currentStatus?.message || "No data"} 
                icon="⚡" 
              />
              <InsightCard 
                title="Temperature Status" 
                value={insights.tempStatus?.value || "N/A"}
                status={insights.tempStatus?.status || "normal"} 
                message={insights.tempStatus?.message || "No data"} 
                icon="🌡️"
              />
              <InsightCard 
                title="Flow Difference" 
                value={insights.leakageStatus?.value || "N/A"}
                status={insights.leakageStatus?.status || "normal"} 
                message={insights.leakageStatus?.message || "No data"} 
                icon="💧"
              />
              <InsightCard 
                title="Pump Efficiency" 
                value={insights.efficiencyStatus?.value || "N/A"}
                status={insights.efficiencyStatus?.status || "normal"} 
                message={insights.efficiencyStatus?.message || "No data"} 
                icon="⚙️"
              />
            </div>
          </div>
        )}

        {/* Charts Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          
          {/* Current Chart */}
          <ChartCard title="⚡ Current Draw" unit="Amperes (A)">
            <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
              <LineChart data={processedData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="time" 
                  stroke="#9ca3af" 
                  tick={{ fontSize: 11 }} 
                  interval="preserveStartEnd"
                  angle={processedData.length > 20 ? -45 : 0}
                  textAnchor={processedData.length > 20 ? "end" : "middle"}
                  height={processedData.length > 20 ? 60 : 30}
                />
                <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelFormatter={(label) => `Time: ${label}`}
                  formatter={(value) => [`${value.toFixed(2)} A`, 'Current']}
                />
                <Legend />
                <ReferenceLine y={CURRENT_WARNING_LIMIT} stroke="#fbbf24" strokeDasharray="5 5" label={{ value: 'Warning', fill: '#fbbf24', fontSize: 10 }} />
                <ReferenceLine y={CURRENT_CRITICAL_LIMIT} stroke="#ef4444" strokeDasharray="5 5" label={{ value: 'Critical', fill: '#ef4444', fontSize: 10 }} />
                <Line type="monotone" dataKey="current" stroke={COLORS.current} strokeWidth={2.5} dot={false} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Temperature Chart */}
          <ChartCard title="🌡️ Temperature" unit="Degrees Celsius (°C)">
            <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
              <LineChart data={processedData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" stroke="#9ca3af" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  formatter={(value) => [`${value.toFixed(1)} °C`, 'Temperature']}
                />
                <Legend />
                <ReferenceLine y={TEMP_WARNING_LIMIT} stroke="#fbbf24" strokeDasharray="5 5" label={{ value: 'Warning', fill: '#fbbf24', fontSize: 10 }} />
                <ReferenceLine y={TEMP_CRITICAL_LIMIT} stroke="#ef4444" strokeDasharray="5 5" label={{ value: 'Critical', fill: '#ef4444', fontSize: 10 }} />
                <Line type="monotone" dataKey="temperature" stroke={COLORS.temperature} strokeWidth={2.5} dot={false} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Flow Comparison Chart */}
          <ChartCard title="🚰 Flow Rates Comparison" unit="Liters per Minute (L/min)">
            <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
              <BarChart data={processedData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" stroke="#9ca3af" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  formatter={(value, name) => [`${value.toFixed(1)} L/min`, name]}
                />
                <Legend />
                <Bar dataKey="flow1" fill={COLORS.flow1} name="Flow 1 (Inlet)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="flow2" fill={COLORS.flow2} name="Flow 2 (Outlet)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Flow Difference Chart */}
          <ChartCard title="📊 Flow Difference (Leakage Detection)" unit="Liters per Minute (L/min)">
            <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
              <ComposedChart data={processedData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" stroke="#9ca3af" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} domain={[0, 'auto']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  formatter={(value) => [`${Math.abs(value).toFixed(2)} L/min`, '|Flow1 - Flow2|']}
                />
                <Legend />
                <ReferenceLine y={FLOW_DIFF_WARNING} stroke="#fbbf24" strokeDasharray="5 5" label={{ value: 'Warning', fill: '#fbbf24', fontSize: 10 }} />
                <ReferenceLine y={FLOW_DIFF_CRITICAL} stroke="#ef4444" strokeDasharray="5 5" label={{ value: 'Critical', fill: '#ef4444', fontSize: 10 }} />
                <Area type="monotone" dataKey="flowDiff" fill={COLORS.flowDiff} stroke={COLORS.flowDiff} strokeWidth={2} fillOpacity={0.3} />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Pump Load/Efficiency Chart */}
          <ChartCard title="⚙️ Pump Efficiency" unit="Load Factor (Flow/Current)">
            <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
              <LineChart data={processedData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" stroke="#9ca3af" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} domain={[0, 2]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  formatter={(value) => [`${value.toFixed(2)}`, 'Efficiency Ratio']}
                />
                <Legend />
                <ReferenceLine y={0.8} stroke="#10b981" strokeDasharray="5 5" label={{ value: 'Good (0.8)', fill: '#10b981', fontSize: 10 }} />
                <ReferenceLine y={0.5} stroke="#fbbf24" strokeDasharray="5 5" label={{ value: 'Warning (0.5)', fill: '#fbbf24', fontSize: 10 }} />
                <Line type="monotone" dataKey="load" stroke={COLORS.load} strokeWidth={2.5} dot={false} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Tank Height Chart */}
          <ChartCard title="🛢️ Tank Level" unit="Meters (m)">
            <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
              <ComposedChart data={processedData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" stroke="#9ca3af" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} domain={[0, 'auto']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  formatter={(value) => [`${value.toFixed(2)} m`, 'Tank Level']}
                />
                <Legend />
                <Area type="monotone" dataKey="tankHeight" fill={COLORS.tank} stroke={COLORS.tank} strokeWidth={2.5} fillOpacity={0.3} />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Footer */}
        <div className="bg-gray-800/30 rounded-xl p-4 text-center text-gray-400 text-xs border border-gray-700">
          <p>⚠️ Dashed lines indicate warning thresholds | Hover on charts for detailed values</p>
          <p className="mt-1">⚙️ Current: {CURRENT_WARNING_LIMIT}A warning | {CURRENT_CRITICAL_LIMIT}A critical | Temp: {TEMP_WARNING_LIMIT}°C warning | Flow Diff: {FLOW_DIFF_WARNING} L/min warning</p>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function StatCard({ title, value, subtitle, status = "normal", icon }) {
  const statusStyles = {
    normal: "border-green-500/30 bg-green-500/5",
    warning: "border-yellow-500/50 bg-yellow-500/10",
    critical: "border-red-500/50 bg-red-500/10"
  };
  
  const textStyles = {
    normal: "text-green-400",
    warning: "text-yellow-400",
    critical: "text-red-400"
  };
  
  return (
    <div className={`rounded-xl p-3 border backdrop-blur transition-all hover:scale-105 ${statusStyles[status]}`}>
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        <span className="text-xs text-gray-400">{title}</span>
      </div>
      <div className={`text-xl font-bold mt-1 ${textStyles[status]}`}>{value}</div>
      {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
    </div>
  );
}

function ChartCard({ title, unit, children }) {
  return (
    <div className="bg-gray-800/20 rounded-xl p-4 border border-gray-700 transition-all hover:shadow-lg hover:shadow-purple-500/5">
      <div className="mb-3 flex justify-between items-center">
        <h4 className="font-bold text-white">{title}</h4>
        <p className="text-xs text-gray-500">{unit}</p>
      </div>
      {children}
    </div>
  );
}

function InsightCard({ title, value, status, message, icon }) {
  const statusConfig = {
    critical: { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', emoji: '🔴' },
    warning: { text: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', emoji: '⚠️' },
    good: { text: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', emoji: '✅' },
    normal: { text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', emoji: 'ℹ️' }
  };
  
  const config = statusConfig[status] || statusConfig.normal;
  
  return (
    <div className={`rounded-lg p-3 border ${config.bg} ${config.border} transition-all hover:scale-[1.02]`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="text-xs font-medium text-gray-300">{title}</span>
        </div>
        <span className="text-sm">{config.emoji}</span>
      </div>
      <div className={`text-xl font-bold ${config.text} mb-1`}>{value}</div>
      <div className="text-xs text-gray-400 leading-relaxed">{message}</div>
    </div>
  );
}

// Analysis Calculations
function calculateInsights(data, stats) {
  if (!data.length || !stats.latest) return {};
  
  const latest = stats.latest;
  const avgCurrent = stats.avgCurrent;
  const avgTemp = stats.avgTemp;
  
  // Current Status
  let currentStatus = { value: `${latest.current.toFixed(1)} A`, status: 'normal', message: 'Current draw within normal range' };
  if (latest.current > CURRENT_CRITICAL_LIMIT) {
    currentStatus = { ...currentStatus, status: 'critical', message: 'CRITICAL: Reduce load immediately!' };
  } else if (latest.current > CURRENT_WARNING_LIMIT) {
    currentStatus = { ...currentStatus, status: 'warning', message: 'High current draw - monitor closely' };
  } else if (latest.current > avgCurrent * 1.3 && avgCurrent > 0) {
    currentStatus = { ...currentStatus, status: 'warning', message: 'Current 30% above average' };
  } else {
    currentStatus.message = 'Current normal ✓';
  }
  
  // Temperature Status
  let tempStatus = { value: `${latest.temperature.toFixed(1)} °C`, status: 'normal', message: 'Temperature within normal range' };
  if (latest.temperature > TEMP_CRITICAL_LIMIT) {
    tempStatus = { ...tempStatus, status: 'critical', message: 'CRITICAL: Overheating! Check cooling!' };
  } else if (latest.temperature > TEMP_WARNING_LIMIT) {
    tempStatus = { ...tempStatus, status: 'warning', message: 'High temperature - check ventilation' };
  } else if (latest.temperature > avgTemp * 1.2 && avgTemp > 0) {
    tempStatus = { ...tempStatus, status: 'warning', message: 'Temperature rising trend' };
  } else {
    tempStatus.message = 'Temperature normal ✓';
  }
  
  // Leakage Status (Flow Difference)
  const flowDiff = latest.flowDiff;
  let leakageStatus = { value: `${flowDiff.toFixed(2)} L/min`, status: 'normal', message: 'No leakage detected' };
  if (flowDiff > FLOW_DIFF_CRITICAL) {
    leakageStatus = { ...leakageStatus, status: 'critical', message: 'CRITICAL: Major leakage suspected!' };
  } else if (flowDiff > FLOW_DIFF_WARNING) {
    leakageStatus = { ...leakageStatus, status: 'warning', message: 'Possible leakage - check connections' };
  } else {
    leakageStatus.message = 'Flow sensors consistent ✓';
  }
  
  // Efficiency Status
  const efficiency = latest.load;
  let efficiencyStatus = { value: efficiency.toFixed(3), status: 'normal', message: 'Pump operating efficiently' };
  if (efficiency < 0.4) {
    efficiencyStatus = { ...efficiencyStatus, status: 'critical', message: 'CRITICAL: Check for blockage!' };
  } else if (efficiency < 0.6) {
    efficiencyStatus = { ...efficiencyStatus, status: 'warning', message: 'Low efficiency - schedule maintenance' };
  } else if (efficiency < 0.8) {
    efficiencyStatus = { ...efficiencyStatus, status: 'warning', message: 'Efficiency below optimal' };
  } else {
    efficiencyStatus.message = 'Efficiency good ✓';
  }
  
  return { currentStatus, tempStatus, leakageStatus, efficiencyStatus };
}
