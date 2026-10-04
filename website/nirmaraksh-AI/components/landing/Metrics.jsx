import { metrics } from "@/data/sections";

export default function Metrics() {
  return (
    <section className="metrics page-container" id="advantages" aria-label="Platform advantages">
      <div className="metrics-intro"><span className="tiny-plus">+</span> BUILT FOR SECURITY TEAMS<br />THAT THINK AHEAD</div>
      {metrics.map(({ number, value, label }) => (
        <div className="metric" key={number}>
          <span className="metric-symbol">{`${number} `}<span>↗</span></span>
          <div><strong>{value}</strong><span>{label}</span></div>
        </div>
      ))}
    </section>
  );
}
