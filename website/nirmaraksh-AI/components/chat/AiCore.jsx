import Image from "next/image";
import s from "./chat.module.css";
import Waveform from "./Waveform";

function AiPortrait() {
  return (
    <div
      className={s.portrait}
      aria-label="Nirmaraksh AI core"
      style={{
        background:
          "radial-gradient(circle at 50% 48%, rgba(0, 229, 239, 0.2) 0%, rgba(2, 24, 35, 0.72) 58%, #020d16 100%)",
      }}
    >
      <Image
        className={s["portrait-figure"]}
        src="/images/nirmaraksh-character.png"
        alt="Nirmaraksh"
        fill
        sizes="(max-width: 520px) 240px, 320px"
        priority
        style={{
          objectPosition: "50% 42%",
          filter:
            "saturate(1.08) contrast(1.05) drop-shadow(0 0 10px rgba(0, 229, 242, 0.45))",
        }}
      />
      <svg
        aria-hidden="true"
        viewBox="0 0 300 300"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 3,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          filter: "drop-shadow(0 0 5px rgba(242, 196, 57, 0.72))",
        }}
      >
        <circle
          cx="150"
          cy="150"
          r="139"
          fill="none"
          stroke="#f1cc58"
          strokeWidth="2"
          strokeDasharray="62 9 4 13"
          opacity=".88"
        />
        <circle
          cx="150"
          cy="150"
          r="132"
          fill="none"
          stroke="#d9a92d"
          strokeWidth="1.2"
          strokeDasharray="2 8 34 10"
          opacity=".72"
        />
        <circle
          cx="150"
          cy="150"
          r="122"
          fill="none"
          stroke="#f6d96d"
          strokeWidth=".8"
          strokeDasharray="1 7"
          opacity=".55"
        />
        <g fill="#ffe27b">
          <circle cx="62" cy="47" r="2.2" />
          <circle cx="238" cy="56" r="1.8" />
          <circle cx="269" cy="142" r="2.1" />
          <circle cx="47" cy="216" r="1.8" />
          <circle cx="222" cy="257" r="2.2" />
        </g>
        <g stroke="#e7b836" strokeWidth="1.5" opacity=".85">
          <path d="M36 107h17l7 7" />
          <path d="M240 43h17l8 8" />
          <path d="M249 238h15l8-8" />
          <path d="M29 174h18" />
        </g>
      </svg>
    </div>
  );
}

export default function AiCore({ isStreaming = false, isVoiceListening = false }) {
  // isStreaming = the AI is generating; isVoiceListening = the microphone is listening. They are independent.
  const active = isStreaming || isVoiceListening;
  const label = isVoiceListening ? "LISTENING" : isStreaming ? "ANALYZING" : "IDLE";
  return (
    <>
      <div className={`${s["core-wrap"]} ${isStreaming ? s["core-active"] : ""} ${isVoiceListening ? s["voice-listening"] : ""}`}>
        {isVoiceListening && <div className={s["voice-aura"]} aria-hidden="true" />}
        <div className={s["hud-corners"]} aria-hidden="true"><i /><i /><i /><i /></div>
        <div className={`${s["hud-ring"]} ${s["ring-one"]}`} />
        <div className={`${s["hud-ring"]} ${s["ring-two"]}`} />
        <div className={`${s["hud-ring"]} ${s["ring-three"]}`} />
        <AiPortrait />
      </div>
      <div className={`${s.status} ${active ? s.active : ""}`} role="status">
        <i /> {label} <i />
      </div>
      <Waveform active={isVoiceListening} />
    </>
  );
}
