// Analysis.jsx - COMPLETE WITH ALL CONFIGURABLE VARIABLES AT THE TOP

// ========== 🎛️ ALL CONFIGURABLE VARIABLES - CHANGE THESE AS NEEDED ==========
import { useState } from "react";
// -------------------- TEMPERATURE THRESHOLDS --------------------
const TEMP_NORMAL_MAX = 42; // °C - Normal operating temperature max
const TEMP_WARNING = 48; // °C - Warning threshold
const TEMP_CRITICAL = 55; // °C - Critical threshold
const TEMP_EMERGENCY = 60; // °C - Emergency shutdown threshold
const TEMP_RATE_WARNING = 1.5; // °C/hour - Temperature rise rate warning
const TEMP_RATE_CRITICAL = 2.0; // °C/hour - Temperature rise rate critical

// -------------------- CURRENT THRESHOLDS --------------------
const CURRENT_NORMAL_MAX = 10; // Amps - Normal current max
const CURRENT_WARNING = 12; // Amps - Warning threshold
const CURRENT_CRITICAL = 13; // Amps - Critical threshold
const CURRENT_SPIKE = 12; // Amps - What counts as a current spike
const CURRENT_JUMP = 3; // Amps - Sudden jump detection (change between readings)
const CURRENT_RATE_WARNING = 0.8; // Amps/hour - Current rise rate warning
const CURRENT_RATE_CRITICAL = 1.2; // Amps/hour - Current rise rate critical

// -------------------- FLOW & LEAKAGE THRESHOLDS --------------------
const FLOW_DIFF_MINOR = 2.5; // L/min - Minor flow discrepancy (monitor)
const FLOW_DIFF_WARNING = 4.0; // L/min - Leakage suspected (warning)
const FLOW_DIFF_CRITICAL = 6.0; // L/min - Major leakage detected (critical)
const FLOW_LOW = 6; // L/min - Low flow threshold
const FLOW_NORMAL_MIN = 8; // L/min - Minimum normal flow
const FLOW_NORMAL_MAX = 20; // L/min - Maximum normal flow

// -------------------- EFFICIENCY THRESHOLDS --------------------
const EFFICIENCY_WARNING = 0.85; // 85% of average efficiency = warning
const EFFICIENCY_CRITICAL = 0.6; // 60% of average efficiency = critical
const HIGH_CURRENT_LOW_FLOW_CURRENT = 12; // Amps - High current threshold for efficiency check
const HIGH_CURRENT_LOW_FLOW_FLOW = 6; // L/min - Low flow threshold for efficiency check

// -------------------- TREND DETECTION THRESHOLDS --------------------
const TREND_SLOW_RISE = 0.03; // Slope value - Gradual increase detection
const TREND_RAPID_RISE = 0.08; // Slope value - Rapid increase detection
const TREND_FALLING = -0.03; // Slope value - Decreasing detection

// -------------------- VIBRATION THRESHOLDS --------------------
const VIBRATION_MINOR_PERCENT = 5; // % of readings - Minor vibration
const VIBRATION_OCCASIONAL_PERCENT = 15; // % of readings - Occasional vibration
const VIBRATION_FREQUENT_SEQUENCE = 5; // Consecutive readings - Frequent vibration
const VIBRATION_CONTINUOUS_SEQUENCE = 10; // Consecutive readings - Continuous vibration
const VIBRATION_SEQUENCE_LENGTH = 3; // Minimum sequence to count as an episode

// -------------------- SPIKE DETECTION THRESHOLDS --------------------
const SPIKE_HIGH_PERCENT = 0.25; // 25% of readings = critical spikes
const SPIKE_MEDIUM_PERCENT = 0.12; // 12% of readings = high spikes
const JUMP_HIGH_PERCENT = 0.15; // 15% of readings = critical jumps
const JUMP_MEDIUM_PERCENT = 0.08; // 8% of readings = high jumps
const SPIKE_MINOR_COUNT = 3; // More than 3 spikes = minor issue

// -------------------- DATA WINDOW --------------------
const DEFAULT_DATA_WINDOW = 200; // Number of data points to analyze

// -------------------- MAINTENANCE SCORE WEIGHTS --------------------
const WEIGHT_THERMAL = 0.25; // Thermal risk weight (0-1)
const WEIGHT_SPIKE = 0.2; // Spike detection weight
const WEIGHT_LEAKAGE = 0.25; // Leakage detection weight
const WEIGHT_VIBRATION = 0.2; // Vibration impact weight
// const WEIGHT_TREND = 0.10;        // Removed - not used

// -------------------- HEALTH SCORE THRESHOLDS --------------------
const HEALTH_CRITICAL = 40; // Score below this = critical
const HEALTH_URGENT = 60; // Score below this = urgent
const HEALTH_WARNING = 75; // Score below this = warning

// -------------------- LEAKAGE EVENT THRESHOLDS --------------------
const LEAKAGE_PERSISTENT_PERCENT = 0.4; // 40% of readings = persistent leakage

// -------------------- CORRELATION THRESHOLDS --------------------
const CORRELATION_STRONG = 0.7; // Correlation coefficient > 0.7 = strong

// ========== END OF CONFIGURABLE VARIABLES ==========

// Keep this for potential future use

export default function Analysis({ data, dataWindow = DEFAULT_DATA_WINDOW }) {
  if (!data.length) return null;

  // Use last N data points or all if less than window
  const analysisData = data.slice(-Math.min(dataWindow, data.length));
  const actualWindowSize = analysisData.length;

  // ========== BASIC STATISTICS ==========
  const tempAvg = (
    analysisData.reduce((a, b) => a + b.Temperature, 0) / analysisData.length
  ).toFixed(2);
  const tempMax = Math.max(...analysisData.map((d) => d.Temperature));
  const tempCurrent = analysisData[analysisData.length - 1].Temperature;

  const currentAvg = (
    analysisData.reduce((a, b) => a + b.Current, 0) / analysisData.length
  ).toFixed(2);
  const currentMax = Math.max(...analysisData.map((d) => d.Current));
  const currentCurrent = analysisData[analysisData.length - 1].Current;

  // Removed unused flow1Avg and flow2Avg
  const flowDiffAvg = (
    analysisData.reduce((a, b) => a + Math.abs(b.Flow1 - b.Flow2), 0) /
    analysisData.length
  ).toFixed(2);

  // ========== TREND DETECTION ==========
  const temperatureTrend = detectTrend(
    analysisData.map((d) => d.Temperature),
    "temperature",
  );
  const currentTrend = detectTrend(
    analysisData.map((d) => d.Current),
    "current",
  );
  const efficiencyTrend = detectEfficiencyTrend(analysisData);
  const correlationTrend = detectCorrelationTrend(analysisData);

  // ========== RISK ANALYSES ==========
  const thermalRisk = analyzeThermalRisk(
    tempAvg,
    tempMax,
    tempCurrent,
    currentAvg,
    currentMax,
    currentCurrent,
    temperatureTrend,
    currentTrend,
    correlationTrend,
  );
  const spikeAnalysis = detectCurrentSpikes(analysisData);
  const leakageAnalysis = detectLeakage(analysisData);
  const efficiencyAnalysis = analyzePumpEfficiency(
    analysisData,
    efficiencyTrend,
  );
  const vibrationAnalysis = analyzeVibrationImpact(analysisData);

  // ========== MAINTENANCE SCORE ==========
  const maintenanceScore = calculateMaintenanceScore(
    analysisData,
    thermalRisk,
    spikeAnalysis,
    leakageAnalysis,
    efficiencyAnalysis,
    vibrationAnalysis,
    temperatureTrend,
    currentTrend,
  );

  // ========== TREND ANALYSIS ==========
  const trendAnalysis = analyzeTrends(
    analysisData,
    temperatureTrend,
    currentTrend,
    correlationTrend,
  );

  return (
    <div className="space-y-6">
      {/* Header with Config Info */}
      <div className="bg-white/10 p-4 rounded-xl">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold mb-2">
              🔬 Advanced Pump Diagnostics
            </h3>
            <p className="text-gray-300 text-sm">
              Analyzing {actualWindowSize} data points | Thresholds: Temp&gt;
              {TEMP_WARNING}°C | Current&gt;{CURRENT_WARNING}A | Leakage&gt;
              {FLOW_DIFF_WARNING}L/min
            </p>
          </div>
          <div className="text-xs text-gray-400 bg-black/20 px-2 py-1 rounded font-mono">
            Configurable
          </div>
        </div>
      </div>

      {/* Trend Alert Banner */}
      {(temperatureTrend.status === "rising_significant" ||
        currentTrend.status === "rising_significant" ||
        correlationTrend.status === "both_rising") && (
        <div className="bg-orange-500/20 border border-orange-500/50 p-4 rounded-xl">
          <h4 className="font-bold text-orange-400 mb-2">
            📈 DEGRADATION TREND DETECTED
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            {temperatureTrend.status === "rising_significant" && (
              <div>
                <span className="text-gray-300">🌡️ Temperature:</span>
                <span className="text-orange-400 ml-2">
                  Rising {temperatureTrend.ratePerHour.toFixed(1)}°C/hour
                </span>
                <p className="text-xs text-gray-400">
                  Warning at {TEMP_RATE_WARNING}°C/h | Critical at{" "}
                  {TEMP_RATE_CRITICAL}°C/h
                </p>
              </div>
            )}
            {currentTrend.status === "rising_significant" && (
              <div>
                <span className="text-gray-300">⚡ Current:</span>
                <span className="text-orange-400 ml-2">
                  Rising {currentTrend.ratePerHour.toFixed(1)}A/hour
                </span>
                <p className="text-xs text-gray-400">
                  Warning at {CURRENT_RATE_WARNING}A/h | Critical at{" "}
                  {CURRENT_RATE_CRITICAL}A/h
                </p>
              </div>
            )}
            {correlationTrend.status === "both_rising" && (
              <div>
                <span className="text-gray-300">⚠️ Critical:</span>
                <span className="text-red-400 ml-2">
                  Temperature & Current both rising!
                </span>
                <p className="text-xs text-gray-400">
                  Serious degradation - schedule inspection
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Risk Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <RiskCard
          title="🔥 Thermal Risk"
          level={thermalRisk.level}
          score={thermalRisk.score}
          message={thermalRisk.message}
          details={thermalRisk.details}
          thresholds={`Normal&lt;${TEMP_NORMAL_MAX}°C | Warn&gt;${TEMP_WARNING}°C | Critical&gt;${TEMP_CRITICAL}°C`}
        />
        <RiskCard
          title="⚡ Electrical Stability"
          level={spikeAnalysis.level}
          score={spikeAnalysis.score}
          message={spikeAnalysis.message}
          details={spikeAnalysis.details}
          thresholds={`Spike&gt;${CURRENT_SPIKE}A | Jump&gt;${CURRENT_JUMP}A`}
        />
        <RiskCard
          title="💧 Leakage Risk"
          level={leakageAnalysis.level}
          score={leakageAnalysis.score}
          message={leakageAnalysis.message}
          details={leakageAnalysis.details}
          thresholds={`Minor&gt;${FLOW_DIFF_MINOR} | Warn&gt;${FLOW_DIFF_WARNING} | Critical&gt;${FLOW_DIFF_CRITICAL} L/min`}
        />
      </div>

      {/* Pump Efficiency & Maintenance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white/10 p-4 rounded-xl">
          <h4 className="text-lg font-bold mb-3">⚙️ Pump Efficiency</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Flow1 vs Flow2 Difference:</span>
              <span
                className={`font-bold ${flowDiffAvg > FLOW_DIFF_WARNING ? "text-red-400" : flowDiffAvg > FLOW_DIFF_MINOR ? "text-yellow-400" : "text-green-400"}`}
              >
                {flowDiffAvg} L/min
              </span>
            </div>
            <div className="flex justify-between">
              <span>Current per Flow (Efficiency):</span>
              <span
                className={`font-bold ${efficiencyAnalysis.efficiency < 0.7 ? "text-red-400" : "text-green-400"}`}
              >
                {efficiencyAnalysis.efficiency.toFixed(2)} A/(L/min)
              </span>
            </div>
            <div className="flex justify-between">
              <span>Efficiency Trend:</span>
              <span
                className={`font-bold ${
                  efficiencyTrend.status === "degrading"
                    ? "text-red-400"
                    : efficiencyTrend.status === "slightly_degrading"
                      ? "text-yellow-400"
                      : "text-green-400"
                }`}
              >
                {efficiencyTrend.message}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <span
                className={`font-bold ${efficiencyAnalysis.status === "Good" ? "text-green-400" : efficiencyAnalysis.status === "Warning" ? "text-yellow-400" : "text-red-400"}`}
              >
                {efficiencyAnalysis.message}
              </span>
            </div>
            {efficiencyAnalysis.suggestion && (
              <div className="mt-2 p-2 bg-yellow-500/20 rounded text-yellow-300 text-sm">
                💡 {efficiencyAnalysis.suggestion}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white/10 p-4 rounded-xl">
          <h4 className="text-lg font-bold mb-3">🔧 Predictive Maintenance</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Health Score:</span>
              <div className="flex-1 mx-3">
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      maintenanceScore > HEALTH_WARNING
                        ? "bg-green-500"
                        : maintenanceScore > HEALTH_URGENT
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    }`}
                    style={{ width: `${maintenanceScore}%` }}
                  />
                </div>
              </div>
              <span className="font-bold">{maintenanceScore}%</span>
            </div>
            <div className="flex justify-between">
              <span>Vibration Pattern:</span>
              <span
                className={`font-bold ${
                  vibrationAnalysis.pattern === "continuous"
                    ? "text-red-400"
                    : vibrationAnalysis.pattern === "frequent"
                      ? "text-orange-400"
                      : vibrationAnalysis.pattern === "occasional"
                        ? "text-yellow-400"
                        : "text-green-400"
                }`}
              >
                {vibrationAnalysis.patternMessage}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Degradation Rate:</span>
              <span
                className={`font-bold ${
                  temperatureTrend.ratePerHour > TEMP_RATE_CRITICAL ||
                  currentTrend.ratePerHour > CURRENT_RATE_CRITICAL
                    ? "text-red-400"
                    : temperatureTrend.ratePerHour > TEMP_RATE_WARNING ||
                        currentTrend.ratePerHour > CURRENT_RATE_WARNING
                      ? "text-yellow-400"
                      : "text-green-400"
                }`}
              >
                {getDegradationRate(temperatureTrend, currentTrend)}
              </span>
            </div>
            <div className="mt-3 p-2 bg-blue-500/20 rounded">
              <p className="text-sm text-blue-300">
                🎯{" "}
                {getMaintenanceRecommendation(
                  maintenanceScore,
                  vibrationAnalysis,
                  thermalRisk,
                  temperatureTrend,
                  currentTrend,
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Rate of Change Analysis */}
      <div className="bg-white/10 p-4 rounded-xl">
        <h4 className="text-lg font-bold mb-3">📈 Rate of Change Analysis</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">🌡️ Temperature Rate:</span>
              <span
                className={`font-bold ${temperatureTrend.ratePerHour > TEMP_RATE_WARNING ? "text-red-400" : temperatureTrend.ratePerHour > TEMP_RATE_WARNING / 2 ? "text-yellow-400" : "text-green-400"}`}
              >
                {temperatureTrend.ratePerHour > 0 ? "+" : ""}
                {temperatureTrend.ratePerHour.toFixed(2)} °C/hour
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5">
              <div
                className="bg-orange-500 h-1.5 rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (temperatureTrend.ratePerHour / TEMP_RATE_CRITICAL) * 100)}%`,
                }}
              />
            </div>
            <p className="text-xs text-gray-400">
              {temperatureTrend.description}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">⚡ Current Rate:</span>
              <span
                className={`font-bold ${currentTrend.ratePerHour > CURRENT_RATE_WARNING ? "text-red-400" : currentTrend.ratePerHour > CURRENT_RATE_WARNING / 2 ? "text-yellow-400" : "text-green-400"}`}
              >
                {currentTrend.ratePerHour > 0 ? "+" : ""}
                {currentTrend.ratePerHour.toFixed(2)} A/hour
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5">
              <div
                className="bg-blue-500 h-1.5 rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (currentTrend.ratePerHour / CURRENT_RATE_CRITICAL) * 100)}%`,
                }}
              />
            </div>
            <p className="text-xs text-gray-400">{currentTrend.description}</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">📊 Efficiency Trend:</span>
              <span
                className={`font-bold ${efficiencyTrend.status === "degrading" ? "text-red-400" : efficiencyTrend.status === "slightly_degrading" ? "text-yellow-400" : "text-green-400"}`}
              >
                {efficiencyTrend.message}
              </span>
            </div>
            <p className="text-xs text-gray-400">
              {efficiencyTrend.description}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">🎯 Prediction:</span>
              <span className="font-bold text-yellow-400">
                {trendAnalysis.prediction}
              </span>
            </div>
            <p className="text-xs text-gray-400">
              {trendAnalysis.recommendation}
            </p>
          </div>
        </div>
      </div>

      {/* Detailed Findings */}
      {(thermalRisk.detailedFindings ||
        spikeAnalysis.detailedFindings ||
        leakageAnalysis.detailedFindings ||
        vibrationAnalysis.detailedFindings ||
        temperatureTrend.status === "rising_significant") && (
        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl">
          <h4 className="font-bold text-red-400 mb-2">⚠️ Critical Findings</h4>
          <ul className="space-y-1 text-sm">
            {temperatureTrend.status === "rising_significant" && (
              <li>
                📈 Temperature rising at{" "}
                {temperatureTrend.ratePerHour.toFixed(1)}°C/hour (Warning:{" "}
                {TEMP_RATE_WARNING}°C/h)
              </li>
            )}
            {currentTrend.status === "rising_significant" && (
              <li>
                📈 Current rising at {currentTrend.ratePerHour.toFixed(1)}A/hour
                (Warning: {CURRENT_RATE_WARNING}A/h)
              </li>
            )}
            {correlationTrend.status === "both_rising" && (
              <li>
                ⚠️ CRITICAL: Temperature and current both rising - Serious pump
                degradation detected
              </li>
            )}
            {thermalRisk.detailedFindings && (
              <li>🔥 {thermalRisk.detailedFindings}</li>
            )}
            {spikeAnalysis.detailedFindings && (
              <li>⚡ {spikeAnalysis.detailedFindings}</li>
            )}
            {leakageAnalysis.detailedFindings && (
              <li>💧 {leakageAnalysis.detailedFindings}</li>
            )}
            {vibrationAnalysis.detailedFindings && (
              <li>📳 {vibrationAnalysis.detailedFindings}</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// ========== HELPER FUNCTIONS (Using the config variables above) ==========

function detectTrend(values, parameterName) {
  if (values.length < 10) {
    return {
      status: "insufficient_data",
      ratePerHour: 0,
      description: "Need more data points",
      message: "Insufficient data",
    };
  }

  const n = values.length;
  const indices = Array.from({ length: n }, (_, i) => i);

  const sumX = indices.reduce((a, b) => a + b, 0);
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXY = indices.reduce((sum, x, i) => sum + x * values[i], 0);
  const sumXX = indices.reduce((sum, x) => sum + x * x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const ratePerHour = slope * 60;

  let status = "stable";
  let description = `${parameterName} is stable`;
  let message = "Stable";

  if (slope > TREND_RAPID_RISE) {
    status = "rising_significant";
    message = "Rapidly increasing";
    description = `${parameterName} increasing at concerning rate (${ratePerHour.toFixed(1)}/hour)`;
  } else if (slope > TREND_SLOW_RISE) {
    status = "rising_slight";
    message = "Slowly increasing";
    description = `${parameterName} showing gradual increase`;
  } else if (slope < TREND_FALLING) {
    status = "falling";
    message = "Decreasing";
    description = `${parameterName} is decreasing`;
  }

  return { status, ratePerHour, slope, description, message };
}

function detectEfficiencyTrend(data) {
  const efficiencies = data.map((d) => {
    const totalFlow = d.Flow1 + d.Flow2;
    return totalFlow / (d.Current || 1);
  });

  const trend = detectTrend(efficiencies, "efficiency");

  let status = "stable";
  let message = "Stable";
  let description = "Pump efficiency holding steady";

  if (trend.slope < -0.015) {
    status = "degrading";
    message = "Rapidly degrading";
    description = "Efficiency dropping quickly - immediate attention needed";
  } else if (trend.slope < -0.005) {
    status = "slightly_degrading";
    message = "Slowly degrading";
    description = "Gradual efficiency loss - monitor closely";
  } else if (trend.slope > 0.005) {
    status = "improving";
    message = "Improving";
    description = "Efficiency showing improvement";
  }

  return {
    status,
    message,
    description,
    slope: trend.slope,
    ratePerHour: trend.ratePerHour,
  };
}

function detectCorrelationTrend(data) {
  if (data.length < 20) return { status: "insufficient", correlation: 0 };

  const recentData = data.slice(-20);
  const temps = recentData.map((d) => d.Temperature);
  const currents = recentData.map((d) => d.Current);

  const tempTrend = detectTrend(temps, "temperature");
  const currentTrend = detectTrend(currents, "current");

  const n = temps.length;
  const sumTemp = temps.reduce((a, b) => a + b, 0);
  const sumCurrent = currents.reduce((a, b) => a + b, 0);
  const sumTempCurrent = temps.reduce((sum, t, i) => sum + t * currents[i], 0);
  const sumTemp2 = temps.reduce((sum, t) => sum + t * t, 0);
  const sumCurrent2 = currents.reduce((sum, c) => sum + c * c, 0);

  const correlation =
    (n * sumTempCurrent - sumTemp * sumCurrent) /
    Math.sqrt(
      (n * sumTemp2 - sumTemp * sumTemp) *
        (n * sumCurrent2 - sumCurrent * sumCurrent),
    );

  let status = "normal";
  let message = "";

  if (
    tempTrend.status === "rising_significant" &&
    currentTrend.status === "rising_significant"
  ) {
    status = "both_rising";
    message = "Critical: Both temperature and current rising!";
  } else if (
    tempTrend.status === "rising_significant" &&
    correlation > CORRELATION_STRONG
  ) {
    status = "correlated_rising";
    message = "Temperature rising with current - pump degradation likely";
  } else if (tempTrend.status === "rising_significant") {
    status = "temp_only_rising";
    message = "Temperature rising (current stable) - possible cooling issue";
  } else if (currentTrend.status === "rising_significant") {
    status = "current_only_rising";
    message = "Current rising - possible blockage developing";
  }

  return { status, message, correlation, tempTrend, currentTrend };
}

function analyzeThermalRisk(
  tempAvg,
  tempMax,
  tempCurrent,
  currentAvg,
  currentMax,
  currentCurrent,
  temperatureTrend,
  currentTrend,
  correlationTrend,
) {
  let score = 100;
  let level = "low";
  let message = "Operating normally";
  let details = "";
  let detailedFindings = "";

  if (tempCurrent > TEMP_CRITICAL || tempMax > TEMP_EMERGENCY) {
    score -= 50;
    level = "critical";
    message = "CRITICAL: Severe overheating!";
    details = `Current temp: ${tempCurrent}°C (Limit: ${TEMP_CRITICAL}°C)`;
    detailedFindings = `Temperature at ${tempCurrent}°C exceeds safe limit. Risk of motor damage.`;
  } else if (tempCurrent > TEMP_WARNING || tempMax > TEMP_CRITICAL) {
    score -= 30;
    level = "high";
    message = "High temperature detected";
    details = `Temp: ${tempCurrent}°C (Warning: ${TEMP_WARNING}°C)`;
    detailedFindings = `Elevated temperature (${tempCurrent}°C) indicates pump working hard.`;
  } else if (tempCurrent > TEMP_NORMAL_MAX) {
    score -= 10;
    level = "medium";
    message = "Elevated temperature";
    details = `Above normal (${TEMP_NORMAL_MAX}°C)`;
  }

  if (temperatureTrend.status === "rising_significant") {
    score -= 20;
    if (level !== "critical") level = "high";
    message = "⚠️ Temperature rising rapidly!";
    details = `Rising at ${temperatureTrend.ratePerHour.toFixed(1)}°C/hour`;
    detailedFindings = `Temperature increasing at ${temperatureTrend.ratePerHour.toFixed(1)}°C/hour. Possible cooling failure.`;
  } else if (temperatureTrend.status === "rising_slight") {
    score -= 8;
    if (level === "low") level = "medium";
    message = "Temperature slowly increasing";
    details = `Monitor trend`;
  }

  if (currentCurrent > CURRENT_CRITICAL && tempCurrent > TEMP_WARNING) {
    score -= 20;
    if (level !== "critical") level = "high";
    message = "⚠️ High current + high temperature = Severe overload!";
    detailedFindings = `Pump at ${currentCurrent}A with ${tempCurrent}°C - Critical condition.`;
  } else if (
    currentCurrent > CURRENT_WARNING &&
    tempCurrent > TEMP_NORMAL_MAX
  ) {
    score -= 10;
    if (level === "low") level = "medium";
    message = "Increased load detected";
  }

  if (correlationTrend.status === "both_rising") {
    score -= 25;
    level = "critical";
    message = "🚨 CRITICAL: Temperature & Current both rising!";
    detailedFindings =
      "Pump showing clear degradation pattern. Immediate inspection required.";
  }

  return {
    score: Math.max(0, score),
    level,
    message,
    details,
    detailedFindings,
  };
}

function detectCurrentSpikes(data) {
  let spikeCount = 0;
  let significantSpikes = 0;

  for (let i = 1; i < data.length; i++) {
    const current = data[i].Current;
    const prevCurrent = data[i - 1].Current;

    if (current > CURRENT_SPIKE) {
      spikeCount++;
    }

    const jump = Math.abs(current - prevCurrent);
    if (jump > CURRENT_JUMP) {
      significantSpikes++;
    }
  }

  let score = 100;
  let level = "low";
  let message = "Stable current draw";
  let details = "";
  let detailedFindings = "";

  const spikePercentage = spikeCount / data.length;
  const spikeJumpPercentage = significantSpikes / data.length;

  if (
    spikePercentage > SPIKE_HIGH_PERCENT ||
    spikeJumpPercentage > JUMP_HIGH_PERCENT
  ) {
    score -= 50;
    level = "critical";
    message = "Severe current instability!";
    details = `${spikeCount} high current events, ${significantSpikes} sudden jumps`;
    detailedFindings = `Current source highly unstable. ${spikeCount} high current events detected. Check power supply.`;
  } else if (
    spikePercentage > SPIKE_MEDIUM_PERCENT ||
    spikeJumpPercentage > JUMP_MEDIUM_PERCENT
  ) {
    score -= 30;
    level = "high";
    message = "Current fluctuations detected";
    detailedFindings = `Intermittent current spikes suggest power supply issues.`;
  } else if (significantSpikes > SPIKE_MINOR_COUNT) {
    score -= 10;
    level = "medium";
    message = "Minor current variations";
    details = `Some fluctuations detected`;
  }

  return {
    score: Math.max(0, score),
    level,
    message,
    details,
    detailedFindings,
    spikeCount,
    significantSpikes,
  };
}

function detectLeakage(data) {
  let flowDifferences = [];
  let majorLeakageEvents = 0;

  for (let i = 0; i < data.length; i++) {
    const diff = Math.abs(data[i].Flow1 - data[i].Flow2);
    flowDifferences.push(diff);
    if (diff > FLOW_DIFF_WARNING) {
      majorLeakageEvents++;
    }
  }

  const avgDiff =
    flowDifferences.reduce((a, b) => a + b, 0) / flowDifferences.length;
  const latestDiff = Math.abs(
    data[data.length - 1].Flow1 - data[data.length - 1].Flow2,
  );

  let score = 100;
  let level = "low";
  let message = "Flow sensors consistent";
  let details = `Avg diff: ${avgDiff.toFixed(2)} L/min`;
  let detailedFindings = "";

  if (avgDiff > FLOW_DIFF_CRITICAL) {
    score -= 60;
    level = "critical";
    message = "MAJOR LEAKAGE DETECTED!";
    details = `Flow mismatch: ${avgDiff.toFixed(2)} L/min avg`;
    detailedFindings = `Flow1 vs Flow2 difference of ${latestDiff.toFixed(1)} L/min indicates pipe leakage. Immediate inspection required.`;
  } else if (avgDiff > FLOW_DIFF_WARNING) {
    score -= 35;
    level = "high";
    message = "Leakage suspected";
    details = `Check pipe connections`;
    detailedFindings = `Persistent flow difference of ${avgDiff.toFixed(1)} L/min suggests possible leak.`;
  } else if (avgDiff > FLOW_DIFF_MINOR) {
    score -= 10;
    level = "medium";
    message = "Minor flow discrepancy";
    details = `Monitor trend - ${avgDiff.toFixed(1)} L/min difference`;
  }

  if (majorLeakageEvents > data.length * LEAKAGE_PERSISTENT_PERCENT) {
    score -= 15;
    message = "⚠️ Persistent flow mismatch";
  }

  return {
    score: Math.max(0, score),
    level,
    message,
    details,
    detailedFindings,
    majorLeakageEvents,
    avgDiff,
  };
}

function analyzePumpEfficiency(data, efficiencyTrend) {
  const efficiencies = [];

  for (let i = 0; i < data.length; i++) {
    const totalFlow = data[i].Flow1 + data[i].Flow2;
    const current = data[i].Current;
    if (current > 0) {
      efficiencies.push(totalFlow / current);
    }
  }

  const avgEfficiency =
    efficiencies.reduce((a, b) => a + b, 0) / efficiencies.length;
  const latestFlow = data[data.length - 1].Flow1 + data[data.length - 1].Flow2;
  const latestCurrent = data[data.length - 1].Current;
  const latestEfficiency = latestCurrent > 0 ? latestFlow / latestCurrent : 0;

  let status = "Good";
  let message = "Efficiency normal";
  let suggestion = "";

  if (efficiencyTrend.status === "degrading") {
    status = "Critical";
    message = "Efficiency rapidly degrading!";
    suggestion =
      "Pump efficiency dropping quickly. Check for blockage or wear immediately.";
  } else if (
    latestEfficiency < avgEfficiency * EFFICIENCY_CRITICAL ||
    efficiencyTrend.status === "slightly_degrading"
  ) {
    status = "Warning";
    message = "Efficiency decreasing";
    suggestion = "Check for partial blockage or wear in pump impeller.";
  } else if (
    latestCurrent > HIGH_CURRENT_LOW_FLOW_CURRENT &&
    latestFlow < HIGH_CURRENT_LOW_FLOW_FLOW
  ) {
    status = "Warning";
    message = "High current, low flow";
    suggestion =
      "Pump working hard but not moving water. Check for blockage or air in system.";
  } else {
    suggestion = "Pump operating efficiently";
  }

  return {
    efficiency: latestEfficiency,
    avgEfficiency: avgEfficiency,
    status,
    message,
    suggestion,
  };
}

function analyzeVibrationImpact(data) {
  let currentSequence = 0;
  let maxSequence = 0;
  let continuousSequences = 0;

  for (let i = 0; i < data.length; i++) {
    if (data[i].Vibration === 1) {
      currentSequence++;
      maxSequence = Math.max(maxSequence, currentSequence);
    } else {
      if (currentSequence >= VIBRATION_SEQUENCE_LENGTH) {
        continuousSequences++;
      }
      currentSequence = 0;
    }
  }
  if (currentSequence >= VIBRATION_SEQUENCE_LENGTH) continuousSequences++;

  const alertCount = data.filter((d) => d.Vibration === 1).length;
  const alertPercentage = (alertCount / data.length) * 100;
  const currentSequenceLength = getCurrentSequenceLength(data);
  const isCurrentlyVibrating = data[data.length - 1].Vibration === 1;

  let pattern = "none";
  let patternMessage = "No vibration detected";
  let detailedFindings = "";
  let correlation = "Normal";
  let score = 100;

  if (
    maxSequence >= VIBRATION_CONTINUOUS_SEQUENCE ||
    (isCurrentlyVibrating &&
      currentSequenceLength >= VIBRATION_FREQUENT_SEQUENCE)
  ) {
    pattern = "continuous";
    patternMessage = "⚠️ CONTINUOUS VIBRATION - Mechanical issue!";
    detailedFindings = `Continuous vibration detected for ${currentSequenceLength} consecutive readings. Immediate inspection required.`;
    correlation = "CRITICAL - Immediate shutdown recommended";
    score -= 50;
  } else if (
    maxSequence >= VIBRATION_FREQUENT_SEQUENCE ||
    continuousSequences >= 3
  ) {
    pattern = "frequent";
    patternMessage = "🔔 Frequent vibration episodes";
    detailedFindings = `Multiple vibration episodes detected (${continuousSequences} continuous sequences). Schedule mechanical inspection.`;
    correlation = "HIGH - Schedule maintenance";
    score -= 30;
  } else if (alertPercentage > VIBRATION_OCCASIONAL_PERCENT) {
    pattern = "occasional";
    patternMessage = "⚠️ Occasional vibration detected";
    detailedFindings = `${alertCount} vibration events in ${data.length} readings. Monitor closely.`;
    correlation = "Elevated - Monitor trend";
    score -= 15;
  } else if (alertPercentage > VIBRATION_MINOR_PERCENT) {
    pattern = "minor";
    patternMessage = "Minor vibration detected";
    correlation = "Minor - Likely normal load variation";
    score -= 5;
  }

  return {
    alertCount,
    alertPercentage: alertPercentage.toFixed(1),
    pattern,
    patternMessage,
    detailedFindings,
    correlation,
    continuousSequences,
    maxSequence,
    isCurrentlyVibrating,
    currentSequenceLength,
    score: Math.max(0, 100 - score),
  };
}

function getCurrentSequenceLength(data) {
  let length = 0;
  for (let i = data.length - 1; i >= 0; i--) {
    if (data[i].Vibration === 1) length++;
    else break;
  }
  return length;
}

function calculateMaintenanceScore(
  data,
  thermalRisk,
  spikeAnalysis,
  leakageAnalysis,
  efficiencyAnalysis,
  vibrationAnalysis,
  temperatureTrend,
  currentTrend,
) {
  let score = 100;

  score -= (100 - thermalRisk.score) * WEIGHT_THERMAL;
  score -= (100 - spikeAnalysis.score) * WEIGHT_SPIKE;
  score -= (100 - leakageAnalysis.score) * WEIGHT_LEAKAGE;
  score -= (100 - vibrationAnalysis.score) * WEIGHT_VIBRATION;

  if (temperatureTrend.ratePerHour > TEMP_RATE_WARNING) score -= 10;
  if (currentTrend.ratePerHour > CURRENT_RATE_WARNING) score -= 10;

  if (efficiencyAnalysis.status === "Warning") score -= 15;
  if (efficiencyAnalysis.status === "Critical") score -= 30;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function analyzeTrends(data, temperatureTrend, currentTrend, correlationTrend) {
  const last10 = data.slice(-10);
  if (last10.length < 5) {
    return {
      prediction: "Need more data",
      recommendation: "Insufficient data",
    };
  }

  const tempLast = last10[last10.length - 1].Temperature;
  const currentLast = last10[last10.length - 1].Current;

  let prediction = "Normal operation expected";
  let recommendation = "Continue monitoring";

  if (correlationTrend.status === "both_rising") {
    prediction = "Failure risk within 48 hours if trend continues";
    recommendation = "IMMEDIATE ACTION: Schedule maintenance today";
  } else if (temperatureTrend.status === "rising_significant") {
    const hoursToCritical = (
      (TEMP_CRITICAL - tempLast) /
      temperatureTrend.ratePerHour
    ).toFixed(0);
    prediction = `Temperature will reach critical in ~${hoursToCritical} hours`;
    recommendation = "Check cooling system and reduce load";
  } else if (currentTrend.status === "rising_significant") {
    const hoursToCritical = (
      (CURRENT_CRITICAL - currentLast) /
      currentTrend.ratePerHour
    ).toFixed(0);
    prediction = `Current will reach limit in ~${hoursToCritical} hours`;
    recommendation = "Check for developing blockage";
  } else if (temperatureTrend.status === "rising_slight") {
    prediction = "Gradual temperature increase - monitor trend";
    recommendation = "Schedule preventive maintenance soon";
  }

  return { prediction, recommendation };
}

function getDegradationRate(temperatureTrend, currentTrend) {
  if (
    temperatureTrend.ratePerHour > TEMP_RATE_CRITICAL &&
    currentTrend.ratePerHour > CURRENT_RATE_CRITICAL
  ) {
    return "CRITICAL - Rapid degradation";
  } else if (
    temperatureTrend.ratePerHour > TEMP_RATE_WARNING ||
    currentTrend.ratePerHour > CURRENT_RATE_WARNING
  ) {
    return "High - Action needed soon";
  } else if (
    temperatureTrend.ratePerHour > TEMP_RATE_WARNING / 2 ||
    currentTrend.ratePerHour > CURRENT_RATE_WARNING / 2
  ) {
    return "Moderate - Monitor closely";
  }
  return "Low - Normal operation";
}

function getMaintenanceRecommendation(
  score,
  vibrationAnalysis,
  thermalRisk,
  temperatureTrend,
  currentTrend,
) {
  if (score < HEALTH_CRITICAL)
    return "⚠️ CRITICAL - Stop pump immediately! Multiple system failures detected.";
  if (score < HEALTH_URGENT)
    return "🔴 URGENT - Schedule maintenance within 24 hours";
  if (
    temperatureTrend.ratePerHour > TEMP_RATE_CRITICAL &&
    currentTrend.ratePerHour > CURRENT_RATE_CRITICAL
  )
    return "🚨 RAPID DEGRADATION - Immediate inspection required";
  if (temperatureTrend.ratePerHour > TEMP_RATE_CRITICAL)
    return "🌡️ RAPID TEMPERATURE RISE - Check cooling system NOW";
  if (currentTrend.ratePerHour > CURRENT_RATE_CRITICAL)
    return "⚡ CURRENT INCREASING - Check for blockage developing";
  if (vibrationAnalysis.pattern === "continuous")
    return "🔧 CONTINUOUS VIBRATION - Check bearings and alignment immediately";
  if (vibrationAnalysis.pattern === "frequent")
    return "📅 Schedule mechanical inspection this week";
  if (thermalRisk.level === "high")
    return "🌡️ Inspect cooling system and reduce duty cycle";
  if (score < HEALTH_WARNING) return "⚠️ Schedule preventive maintenance soon";
  return "✅ System operating normally - Routine maintenance on schedule";
}

// Risk Card Component
function RiskCard({ title, level, score, message, details, thresholds }) {
  const getColor = () => {
    switch (level) {
      case "critical":
        return "border-red-500 bg-red-500/10";
      case "high":
        return "border-orange-500 bg-orange-500/10";
      case "medium":
        return "border-yellow-500 bg-yellow-500/10";
      default:
        return "border-green-500 bg-green-500/10";
    }
  };

  const getScoreColor = () => {
    if (score < HEALTH_CRITICAL) return "text-red-400";
    if (score < HEALTH_URGENT) return "text-yellow-400";
    return "text-green-400";
  };

  return (
    <div className={`border-l-4 p-3 rounded-r-xl ${getColor()}`}>
      <div className="flex justify-between items-start">
        <h4 className="font-bold">{title}</h4>
        <span className={`text-sm font-bold ${getScoreColor()}`}>{score}%</span>
      </div>
      <p className="text-sm font-semibold mt-1">{message}</p>
      {details && <p className="text-xs text-gray-400 mt-1">{details}</p>}
      {thresholds && (
        <p className="text-xs text-gray-500 mt-2 font-mono">{thresholds}</p>
      )}
    </div>
  );
}
