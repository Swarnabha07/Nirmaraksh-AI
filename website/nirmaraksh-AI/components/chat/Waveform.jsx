import s from "./chat.module.css";

export default function Waveform({ small = false, active = false }) {
  const bars = Array.from({ length: small ? 8 : 38 }, (_, index) => index);
  return (
    <div className={`${small ? `${s.waveform} ${s.mini}` : s.waveform} ${active ? s["waveform-active"] : ""}`} aria-hidden="true">
      {bars.map((bar) => (
        <i key={bar} style={{ animationDelay: `${(bar % 9) * -0.11}s` }} />
      ))}
    </div>
  );
}
