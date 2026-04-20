export default function Stats({ data }) {
  if (!data.length) return null;

  const latest = data[data.length - 1];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="card">🌡 {latest.Temperature} °C</div>
      <div className="card">💧 {latest.Humidity} %</div>
      <div className="card">
        🚰 {latest.Flow1} / {latest.Flow2}
      </div>
      <div className="card">⚡ {latest.Current} A</div>
      <div className="card">🛢 {latest.TankHeight}</div>
      <div className="card">📳 {latest.Vibration ? "ALERT" : "OK"}</div>
    </div>
  );
}
