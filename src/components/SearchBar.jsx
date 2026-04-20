// SearchBar.jsx - Clean & Simple
import { useState } from "react";

export default function SearchBar({ setDevice }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!input.trim()) return;

    setLoading(true);

    // Simulate loading (remove this in production)
    setTimeout(() => {
      // Check for cached data
      const cached = localStorage.getItem(input);
      if (cached) {
        console.log(`📦 Loaded ${input} from archive`);
      }

      setDevice(input);
      setLoading(false);
    }, 500);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="flex gap-2">
      <div className="flex-1 relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          {loading ? (
            <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          ) : (
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
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          )}
        </div>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Search device (e.g., pump_0, motor_1)..."
          className="w-full pl-9 pr-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 transition"
        />
      </div>

      <button
        onClick={handleSearch}
        disabled={loading}
        className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg text-white font-medium hover:shadow-lg hover:shadow-cyan-500/30 transition disabled:opacity-50"
      >
        {loading ? "Searching..." : "Search"}
      </button>
    </div>
  );
}
