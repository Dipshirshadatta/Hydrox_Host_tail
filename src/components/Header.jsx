// Header.jsx - Clean & Simple
import { useState, useEffect } from "react";

export default function Header() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = currentTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl p-4 backdrop-blur border border-white/10">
      <div className="flex justify-between items-center">
        {/* Logo Section */}
        <div className="flex items-center gap-3">
          <div className="text-3xl">⚡</div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              HydroX
            </h1>
            <p className="text-xs text-gray-400">Industrial Monitoring</p>
          </div>
        </div>

        {/* Status & Time */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm text-green-400">Live</span>
          </div>
          <div className="text-sm text-gray-300 font-mono">{formattedTime}</div>
        </div>
      </div>
    </div>
  );
}
