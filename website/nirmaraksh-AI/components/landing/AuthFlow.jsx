"use client";

import { useState } from "react";
import { FeatureIcon } from "@/components/ui/Icons";
import { authErrors, authScenarios, authSteps } from "@/data/access";

const FINAL_STEP = authSteps.length - 1;
const ERROR_SCENARIOS = ["unauthorized", "invalid", "denied"];

const classNames = (...names) => names.filter(Boolean).join(" ");
const stopStepFor = (scenario) => (scenario === "success" ? FINAL_STEP : authErrors[scenario].step);

function nodeState(index, stopAt, failed) {
  if (index > stopAt) return "NOT REACHED";
  return index === stopAt && failed ? "CHECK FAILED" : "VALIDATED";
}

export default function AuthFlow() {
  const [scenario, setScenario] = useState("success");
  const [selectedStep, setSelectedStep] = useState(FINAL_STEP);
  const succeeded = scenario === "success";
  const stopAt = stopStepFor(scenario);

  function selectScenario(next) {
    setScenario(next);
    setSelectedStep(stopStepFor(next));
  }

  return (
    <div className="auth-console">
      <div className="auth-console-header">
        <span><span className="live-dot" /> AUTHENTICATION / DECISION TREE</span>
        <span>FLOW ID: 2FA-001 <span className="console-header-cross">+</span></span>
      </div>

      <div className="auth-toolbar">
        <div>
          <span className="auth-toolbar-label">EXPLORE A PATH</span>
          <p>Select a scenario to trace its outcome.</p>
        </div>
        <div className="scenario-tabs" role="group" aria-label="Authentication scenario">
          {authScenarios.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              className={scenario === value ? (value === "success" ? "selected" : "selected error-selected") : ""}
              aria-pressed={scenario === value}
              onClick={() => selectScenario(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="auth-chart-scroll">
        <div className="auth-chart">
          {authSteps.map((step, index) => (
            <button
              key={step.title}
              type="button"
              onClick={() => setSelectedStep(index)}
              className={classNames("auth-node", index <= stopAt && "on-path", selectedStep === index && "inspected", index === stopAt && !succeeded && "failed-node")}
              style={{ gridColumn: index + 1, gridRow: 1 }}
              aria-pressed={selectedStep === index}
            >
              <span className="auth-node-top">
                <span className="auth-node-icon"><FeatureIcon name={step.icon} /></span>
                <span>0{index + 1}</span>
              </span>
              <strong>{step.title}</strong>
              <span className="auth-node-state">{nodeState(index, stopAt, !succeeded)}</span>
            </button>
          ))}
          {ERROR_SCENARIOS.map((error) => (
            <button
              key={error}
              type="button"
              className={classNames("auth-error", scenario === error && "active")}
              style={{ gridColumn: authErrors[error].step + 1, gridRow: 2 }}
              onClick={() => selectScenario(error)}
              aria-pressed={scenario === error}
            >
              <span className="auth-error-link" />
              <span className="auth-error-title"><span>×</span> {authErrors[error].label}</span>
              <small>{error === "invalid" ? "RETRY REQUIRED" : "SESSION BLOCKED"}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="auth-readout">
        <div>
          <span className="auth-readout-kicker">INSPECTING / 0{selectedStep + 1}</span>
          <strong>{authSteps[selectedStep].title}</strong>
          <p>{authSteps[selectedStep].detail}</p>
        </div>
        <div className={classNames("auth-outcome", succeeded && "is-success")}>
          <span>{succeeded ? "PATH COMPLETE" : "EXCEPTION PATH"}</span>
          <strong>{succeeded ? "Access granted" : authErrors[scenario].label}</strong>
          <small>{succeeded ? "Identity verified · Decision logged" : authErrors[scenario].detail}</small>
        </div>
      </div>
    </div>
  );
}
