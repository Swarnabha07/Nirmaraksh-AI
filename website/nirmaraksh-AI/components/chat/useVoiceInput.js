import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Frontend voice input using the browser's built-in speech recognition only.
 * No external speech API, no backend. States: "idle" -> "listening" -> "processing" -> "idle".
 * BACKEND INTEGRATION BOUNDARY: swap the internals for a different speech service later;
 * keep the { status, start, stop, toggle } surface.
 */

const ERROR_MESSAGES = {
  unsupported: "Voice input isn't supported in this browser.",
  "not-allowed": "Microphone access was blocked.",
  "service-not-allowed": "Microphone access was blocked.",
  "audio-capture": "No microphone was found.",
  default: "Voice input failed. Please try again.",
};

export default function useVoiceInput({ onTranscript, onError }) {
  const [status, setStatus] = useState("idle");
  const recognitionRef = useRef(null);
  const textRef = useRef({ final: "", interim: "" });
  const timeoutRef = useRef(null);
  const callbacks = useRef({ onTranscript, onError });

  useEffect(() => {
    callbacks.current = { onTranscript, onError };
  });

  const finish = useCallback(() => {
    clearTimeout(timeoutRef.current);
    if (!recognitionRef.current) return;
    recognitionRef.current = null;
    const text = `${textRef.current.final} ${textRef.current.interim}`.replace(/\s+/g, " ").trim();
    setStatus("idle");
    if (text) callbacks.current.onTranscript?.(text);
  }, []);

  const start = useCallback(() => {
    if (recognitionRef.current) return;
    const Recognition = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!Recognition) {
      callbacks.current.onError?.({ code: "unsupported", message: ERROR_MESSAGES.unsupported });
      return;
    }

    const recognition = new Recognition();
    recognition.lang = navigator.language || "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    textRef.current = { final: "", interim: "" };

    recognition.onresult = (event) => {
      let final = "";
      let interim = "";
      for (let i = 0; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result.isFinal) final += result[0].transcript;
        else interim += result[0].transcript;
      }
      textRef.current = { final, interim };
    };
    recognition.onerror = (event) => {
      if (event.error === "no-speech" || event.error === "aborted") return;
      const message = ERROR_MESSAGES[event.error] ?? ERROR_MESSAGES.default;
      callbacks.current.onError?.({ code: event.error, message });
    };
    recognition.onend = finish;

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setStatus("listening");
    } catch {
      callbacks.current.onError?.({ code: "start-failed", message: ERROR_MESSAGES.default });
    }
  }, [finish]);

  const stop = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    setStatus("processing");
    recognition.stop();
    timeoutRef.current = setTimeout(finish, 2500); // safety net if `end` never fires
  }, [finish]);

  const toggle = useCallback(() => {
    if (status === "listening") stop();
    else if (status === "idle") start();
  }, [status, start, stop]);

  useEffect(
    () => () => {
      clearTimeout(timeoutRef.current);
      const recognition = recognitionRef.current;
      if (recognition) {
        recognition.onend = null;
        recognition.abort();
        recognitionRef.current = null;
      }
    },
    [],
  );

  return { status, start, stop, toggle };
}
