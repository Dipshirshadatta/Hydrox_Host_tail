import { useEffect, useState } from "react";
import Header from "./components/Header";
import SearchBar from "./components/SearchBar";
import Charts from "./components/Charts";
import Analysis from "./components/Analysis";
import Alerts from "./components/Alerts";
import Loader from "./components/Loader";

const API = "https://66av9zqdvj.execute-api.us-east-1.amazonaws.com/ESP32_AWSDB/pub"; // 🔴 replace
export default function App() {
  const [device, setDevice] = useState("pump_0");
  const [data, setData] = useState([]);
  const [view, setView] = useState("chart");
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    
    const res = await fetch(`${API}?device=${device}`);
    const json = await res.json();
    json.sort((a, b) => a.TS - b.TS);
    setData(json);

    // 💾 Save archive
    localStorage.setItem(device, JSON.stringify(json));


  };

  useEffect(() => {
    fetchData();
    const i = setInterval(fetchData, 5000);
    return () => clearInterval(i);
  }, [device]);

  return (
    <div className="p-4 space-y-6">
      <Header />

      <SearchBar setDevice={setDevice} />

      <div className="flex gap-4">
        <button onClick={() => setView("chart")} className="btn">📊 Charts</button>
        <button onClick={() => setView("analysis")} className="btn">🧠 Analysis</button>
      </div>

      <Alerts data={data} />

      {loading ? <Loader /> : (
        view === "chart" ? <Charts data={data} /> : <Analysis data={data} />
      )}
    </div>
  );
}
