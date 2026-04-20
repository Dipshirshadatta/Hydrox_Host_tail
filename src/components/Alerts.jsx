// Alerts.jsx - Premium UI with animations
import { useState, useEffect } from "react";

// Configurable thresholds (matching Analysis.jsx)
const ALERT_CONFIG = {
  VIBRATION_CRITICAL: 1,
  CURRENT_CRITICAL: 15,
  CURRENT_HIGH: 12,
  TEMP_CRITICAL: 55,
  TEMP_HIGH: 45,
  TEMP_MEDIUM: 40,
  FLOW_DIFF_CRITICAL: 5,
  FLOW_DIFF_HIGH: 3,
  FLOW_DIFF_MEDIUM: 2,
  EFFICIENCY_HIGH_CURRENT: 10,
  EFFICIENCY_LOW_FLOW: 8,
  CURRENT_SPIKE_THRESHOLD: 5,
};

export default function Alerts({ data }) {
  const [dismissed, setDismissed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  if (!data.length) return null;

  const d = data[data.length - 1];
  const alerts = [];

  // Check for all conditions and collect alerts
  if (d.Vibration === ALERT_CONFIG.VIBRATION_CRITICAL) {
    alerts.push({
      type: "critical",
      icon: "🚨",
      title: "Mechanical Failure",
      message: "Immediate shutdown recommended!",
      detail: "Continuous vibration detected indicating mechanical damage",
      action: "Stop pump and inspect bearings immediately",
    });
  }

  if (d.Current > ALERT_CONFIG.CURRENT_CRITICAL) {
    alerts.push({
      type: "critical",
      icon: "⚡",
      title: "Critical Overload",
      message: `Current at ${d.Current}A! Reduce load immediately`,
      detail: `Current exceeds safe limit of ${ALERT_CONFIG.CURRENT_CRITICAL}A`,
      action: "Reduce load or shutdown to prevent motor damage",
    });
  } else if (d.Current > ALERT_CONFIG.CURRENT_HIGH) {
    alerts.push({
      type: "high",
      icon: "⚠️",
      title: "High Load",
      message: `Current: ${d.Current}A, monitor closely`,
      detail: "Pump operating near maximum capacity",
      action: "Check for blockages or reduce flow rate",
    });
  }

  if (d.Temperature > ALERT_CONFIG.TEMP_CRITICAL) {
    alerts.push({
      type: "critical",
      icon: "🔥",
      title: "Critical Overheating",
      message: `Temperature: ${d.Temperature}°C! Risk of motor failure`,
      detail: `Temperature exceeds ${ALERT_CONFIG.TEMP_CRITICAL}°C safe limit`,
      action: "Immediate cooling required - check ventilation",
    });
  } else if (d.Temperature > ALERT_CONFIG.TEMP_HIGH) {
    alerts.push({
      type: "high",
      icon: "🔥",
      title: "Overheating Detected",
      message: `Temperature: ${d.Temperature}°C`,
      detail: "Pump temperature above normal operating range",
      action: "Check cooling system and reduce duty cycle",
    });
  } else if (d.Temperature > ALERT_CONFIG.TEMP_MEDIUM) {
    alerts.push({
      type: "medium",
      icon: "🌡️",
      title: "Elevated Temperature",
      message: `${d.Temperature}°C`,
      detail: "Temperature above normal but within safe limits",
      action: "Monitor trend and schedule maintenance check",
    });
  }

  // Flow difference (leakage detection)
  const flowDiff = Math.abs(d.Flow1 - d.Flow2);
  if (flowDiff > ALERT_CONFIG.FLOW_DIFF_CRITICAL) {
    alerts.push({
      type: "critical",
      icon: "💧",
      title: "Major Leakage",
      message: `Flow mismatch: ${d.Flow1} vs ${d.Flow2} L/min (Diff: ${flowDiff})`,
      detail: "Significant flow difference indicates pipe leakage",
      action: "Immediate pipe inspection required",
    });
  } else if (flowDiff > ALERT_CONFIG.FLOW_DIFF_HIGH) {
    alerts.push({
      type: "high",
      icon: "💧",
      title: "Leakage Suspected",
      message: `Flow difference: ${flowDiff} L/min`,
      detail: "Persistent flow mismatch may indicate leak",
      action: "Check pipe connections and seals",
    });
  } else if (flowDiff > ALERT_CONFIG.FLOW_DIFF_MEDIUM) {
    alerts.push({
      type: "medium",
      icon: "💧",
      title: "Minor Flow Discrepancy",
      message: `${flowDiff} L/min difference`,
      detail: "Small flow variation detected",
      action: "Monitor trend for developing issues",
    });
  }

  // Pump efficiency issue
  const totalFlow = d.Flow1 + d.Flow2;
  if (
    d.Current > ALERT_CONFIG.EFFICIENCY_HIGH_CURRENT &&
    totalFlow < ALERT_CONFIG.EFFICIENCY_LOW_FLOW
  ) {
    alerts.push({
      type: "high",
      icon: "⚠️",
      title: "Pump Inefficiency",
      message: `High current (${d.Current}A) but low flow (${totalFlow} L/min)`,
      detail: "Pump consuming power but not moving water effectively",
      action: "Check for blockage, cavitation, or impeller damage",
    });
  }

  // Current spikes detection from history
  if (data.length > 5) {
    const recentCurrents = data.slice(-5).map((p) => p.Current);
    const currentSpike =
      Math.max(...recentCurrents) - Math.min(...recentCurrents);
    if (currentSpike > ALERT_CONFIG.CURRENT_SPIKE_THRESHOLD) {
      alerts.push({
        type: "medium",
        icon: "⚡",
        title: "Current Fluctuations",
        message: `Range: ${currentSpike.toFixed(1)}A variation`,
        detail: "Unstable current draw detected",
        action: "Check power supply and electrical connections",
      });
    }
  }

  // If no alerts
  if (alerts.length === 0) {
    return (
      <div className="relative overflow-hidden bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-4 backdrop-blur animate-slide-in">
        <div className="absolute inset-0 bg-green-500/5 animate-pulse" />
        <div className="relative flex items-center gap-3">
          <div className="text-2xl animate-bounce">✅</div>
          <div>
            <h4 className="font-bold text-green-400">All Systems Normal</h4>
            <p className="text-sm text-gray-300">Pump operating efficiently</p>
          </div>
          <div className="ml-auto flex gap-1">
            <div className="w-1 h-4 bg-green-400 rounded-full animate-pulse" />
            <div className="w-1 h-4 bg-green-400 rounded-full animate-pulse delay-150" />
            <div className="w-1 h-4 bg-green-400 rounded-full animate-pulse delay-300" />
          </div>
        </div>
      </div>
    );
  }

  // Priority: critical > high > medium
  const priorityOrder = { critical: 0, high: 1, medium: 2 };
  const topAlert = alerts.sort(
    (a, b) => priorityOrder[a.type] - priorityOrder[b.type],
  )[0];
  const alertCount = alerts.length;

  const getStyles = () => {
    switch (topAlert.type) {
      case "critical":
        return {
          bg: "from-red-500/20 to-red-600/10",
          border: "border-red-500/40",
          glow: "shadow-red-500/20",
          text: "text-red-400",
          button: "bg-red-500/20 hover:bg-red-500/30 text-red-300",
          iconBg: "bg-red-500/20",
        };
      case "high":
        return {
          bg: "from-orange-500/20 to-orange-600/10",
          border: "border-orange-500/40",
          glow: "shadow-orange-500/20",
          text: "text-orange-400",
          button: "bg-orange-500/20 hover:bg-orange-500/30 text-orange-300",
          iconBg: "bg-orange-500/20",
        };
      default:
        return {
          bg: "from-yellow-500/20 to-yellow-600/10",
          border: "border-yellow-500/40",
          glow: "shadow-yellow-500/20",
          text: "text-yellow-400",
          button: "bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300",
          iconBg: "bg-yellow-500/20",
        };
    }
  };

  const styles = getStyles();

  if (dismissed) {
    return (
      <button
        onClick={() => setDismissed(false)}
        className="w-full text-center py-2 text-gray-400 hover:text-white text-sm transition-colors"
      >
        🔔 {alertCount} alert(s) dismissed - Click to restore
      </button>
    );
  }

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-r ${styles.bg} border ${styles.border} rounded-xl backdrop-blur shadow-lg ${styles.glow} animate-slide-in`}
    >
      {/* Animated Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 animate-shimmer" />

      {/* Alert Icon Animation */}
      <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-red-500/10 animate-ping" />

      <div className="relative p-4">
        <div className="flex items-start gap-3">
          {/* Icon with pulse animation */}
          <div
            className={`text-3xl ${topAlert.type === "critical" ? "animate-shake" : "animate-pulse"}`}
          >
            {topAlert.icon}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className={`font-bold ${styles.text}`}>{topAlert.title}</h4>
              <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">
                {alertCount} {alertCount === 1 ? "issue" : "issues"}
              </span>
            </div>
            <p className="text-white font-medium mt-1">{topAlert.message}</p>
            <p className="text-gray-300 text-sm mt-1">{topAlert.detail}</p>

            {/* Action Button */}
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs px-2 py-1 rounded bg-white/5 hover:bg-white/10 transition-colors"
              >
                {showDetails ? "▼ Hide" : "▶ Show"} Actions
              </button>
              <button
                onClick={() => setDismissed(true)}
                className="text-xs px-2 py-1 rounded bg-white/5 hover:bg-white/10 transition-colors"
              >
                Dismiss
              </button>
            </div>

            {/* Action Details */}
            {showDetails && (
              <div className="mt-3 p-3 bg-black/30 rounded-lg border border-white/10 animate-slide-down">
                <div className="flex items-start gap-2">
                  <span className="text-blue-400">🔧</span>
                  <div>
                    <p className="text-sm font-medium text-blue-300">
                      Recommended Action:
                    </p>
                    <p className="text-sm text-gray-300">{topAlert.action}</p>
                    {alertCount > 1 && (
                      <p className="text-xs text-gray-400 mt-2">
                        + {alertCount - 1} other issue(s) detected
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={() => setDismissed(true)}
            className="opacity-50 hover:opacity-100 transition-opacity"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-5px);
          }
          75% {
            transform: translateX(5px);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
        .animate-slide-down {
          animation: slide-down 0.2s ease-out;
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        .animate-bounce {
          animation: bounce 1s ease-in-out infinite;
        }
        @keyframes bounce {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }
        .delay-150 {
          animation-delay: 150ms;
        }
        .delay-300 {
          animation-delay: 300ms;
        }
      `}</style>
    </div>
  );
}
