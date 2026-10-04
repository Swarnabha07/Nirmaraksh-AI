import { useEffect, useRef, useState } from 'react'
import nirmarakshLogo from '@/imports/Nirmaraksh_Ai_Logo-3.png'

type AgentKind = 'recon' | 'analysis' | 'verification' | 'reporting' | 'manager'

const agents: { kind: AgentKind; name: string; detail: string; number: string }[] = [
  { kind: 'recon', name: 'Recon', detail: 'Surface discovery', number: '01' },
  { kind: 'analysis', name: 'Analysis', detail: 'Intelligent assessment', number: '02' },
  { kind: 'verification', name: 'Verification', detail: 'Exploit validation', number: '03' },
  { kind: 'reporting', name: 'Reporting', detail: 'Actionable insights', number: '04' },
]

const demoSteps = [
  { title: 'Map the attack surface', agent: 'Recon Agent', description: 'Discover exposed assets and identify the paths that matter most.' },
  { title: 'Connect the signals', agent: 'Analysis Agent', description: 'Turn scattered findings into a prioritized picture of real risk.' },
  { title: 'Verify with confidence', agent: 'Verification Agent', description: 'Validate potential vulnerabilities before they become noise.' },
  { title: 'Make the next move clear', agent: 'Reporting Agent', description: 'Deliver an auditable story your team can act on.' },
]

function AgentIcon({ kind }: { kind: AgentKind }) {
  const paths: Record<AgentKind, React.ReactNode> = {
    recon: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5M11 7.5v7M7.5 11h7" /></>,
    analysis: <><path d="M3 18.5h18M5.5 15.5l4-4 3 2.5 6-7" /><path d="M15.5 7h3v3" /></>,
    verification: <><path d="m12 2.5 8 3.2v5.7c0 5-3.2 8.3-8 10.1-4.8-1.8-8-5.1-8-10.1V5.7L12 2.5Z" /><path d="m8.5 11.8 2.5 2.5 4.7-5" /></>,
    reporting: <><path d="M6 2.5h9l4 4V21H6V2.5Z" /><path d="M15 2.5v4h4M9 11h7M9 14.5h7M9 18h4" /></>,
    manager: <><circle cx="12" cy="12" r="3" /><circle cx="12" cy="3" r="1.5" /><circle cx="21" cy="12" r="1.5" /><circle cx="12" cy="21" r="1.5" /><circle cx="3" cy="12" r="1.5" /><path d="M12 9V4.5M15 12h4.5M12 15v4.5M9 12H4.5" /></>,
  }

  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[kind]}</svg>
}

function ArrowIcon({ diagonal = false }: { diagonal?: boolean }) {
  return diagonal ? (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4.5 15.5 15 5M6.5 5H15v8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ) : (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M3.5 10h12m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
  )
}

type FeatureIconName = 'isolated' | 'scattered' | 'manual' | 'understand' | 'plan' | 'execute' | 'analyze' | 'verify' | 'approval' | 'audit' | 'targets' | 'compliance'

function FeatureIcon({ name }: { name: FeatureIconName }) {
  const paths: Record<FeatureIconName, React.ReactNode> = {
    isolated: <><rect x="3" y="4" width="7" height="7" rx="1.5" /><rect x="14" y="13" width="7" height="7" rx="1.5" /><path d="m10 14 4-4" strokeDasharray="2 3" /></>,
    scattered: <><rect x="3" y="4" width="7" height="6" rx="1" /><rect x="14" y="4" width="7" height="6" rx="1" /><rect x="8.5" y="15" width="7" height="6" rx="1" /><path d="M6 7h1m10 0h1m-6 11h1" /></>,
    manual: <><path d="M4 12a8 8 0 0 1 14-5M20 12a8 8 0 0 1-14 5" /><path d="M18 3v4h-4M6 21v-4h4" /><path d="M12 8v4l2.5 1.5" /></>,
    understand: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5M8 10.5h5M10.5 8v5" /></>,
    plan: <><path d="M4 4.5h5v5H4zM15 4.5h5v5h-5zM9.5 15h5v5h-5zM9 7h6M17.5 9.5v2.5l-5.5 3M6.5 9.5V12l5.5 3" /></>,
    execute: <><path d="m13 2-9 11h7l-1 9 10-12h-7l0-8Z" /></>,
    analyze: <><path d="M3 18.5h18M5 15l4-4 3 2.5 6-7M15.5 6.5H18v2.5" /><circle cx="9" cy="11" r="1" /></>,
    verify: <><path d="m12 2.5 8 3.2v5.7c0 5-3.2 8.3-8 10.1-4.8-1.8-8-5.1-8-10.1V5.7L12 2.5Z" /><path d="m8.5 11.8 2.5 2.5 4.7-5" /></>,
    approval: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h4m-4 4 2 2 5-5" /></>,
    audit: <><path d="M5 3h11l3 3v15H5V3Z" /><path d="M16 3v4h3M8 10h8M8 14h8M8 18h5" /></>,
    targets: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" /><path d="M12 1v3M12 20v3M1 12h3M20 12h3" /></>,
    compliance: <><path d="M12 2.5 20 6v5.7c0 5-3.2 8-8 9.8-4.8-1.8-8-4.8-8-9.8V6l8-3.5Z" /><path d="M9 11h6M9 14h6M10 8h4" /></>,
  }

  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

const problems: { number: string; icon: FeatureIconName; title: string; description: string; tag: string }[] = [
  { number: '01', icon: 'isolated', title: 'Recon Tools Are Isolated', description: 'Discovery happens in silos. Context gets lost before testing even begins.', tag: 'DISCONNECTED SIGNALS' },
  { number: '02', icon: 'scattered', title: 'Findings Are Scattered', description: 'Critical evidence lives across dashboards, documents, and disconnected teams.', tag: 'FRAGMENTED CONTEXT' },
  { number: '03', icon: 'manual', title: 'Verification Is Manual', description: 'Analysts spend valuable time triaging noise instead of validating real risk.', tag: 'SLOWER DECISIONS' },
]

const workflow: { number: string; icon: FeatureIconName; title: string; description: string }[] = [
  { number: '01', icon: 'understand', title: 'Understand', description: 'Map your environment and define the mission.' },
  { number: '02', icon: 'plan', title: 'Plan', description: 'Set the scope, priorities, and guardrails.' },
  { number: '03', icon: 'execute', title: 'Execute', description: 'Specialized agents work in coordination.' },
  { number: '04', icon: 'analyze', title: 'Analyze', description: 'Connect evidence and surface what matters.' },
  { number: '05', icon: 'verify', title: 'Verify', description: 'Confirm findings with human oversight.' },
]

const controls: { number: string; icon: FeatureIconName; title: string; description: string }[] = [
  { number: '01', icon: 'approval', title: 'Approval Gates', description: 'Put a human decision at every critical step before agents move forward.' },
  { number: '02', icon: 'audit', title: 'Audit Trail', description: 'Keep a clear record of actions, evidence, and decisions from start to finish.' },
  { number: '03', icon: 'targets', title: 'Authorized Targets', description: 'Keep testing focused on the assets and boundaries your team approves.' },
  { number: '04', icon: 'compliance', title: 'Compliance Ready', description: 'Make oversight and accountability part of the workflow, not an afterthought.' },
]

function RadialGeometry({ className = '' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 600 600" fill="none" aria-hidden="true">
    <circle cx="300" cy="300" r="278" /><circle cx="300" cy="300" r="236" />
    {Array.from({ length: 24 }, (_, i) => <g key={i} transform={`rotate(${i * 15} 300 300)`}>
      <path d="M300 16v18m0 9v8M300 62v15M294 39h12" />
      <ellipse cx="300" cy="201" rx="59" ry="133" />
    </g>)}
  </svg>
}

function SecurityCore() {
  const [selected, setSelected] = useState<AgentKind>('manager')
  const [paused, setPaused] = useState(false)
  const stage = useRef<HTMLDivElement>(null)
  const active = agents.find((agent) => agent.kind === selected)

  return <div className={`command-center${paused ? ' motion-paused' : ''}`}>
    <div className="command-topline"><span><i className="status-dot" /> AGENT ORCHESTRATION</span><span>SYS.01 / SECURE</span></div>
    <div className="core-stage" ref={stage} onPointerMove={(event) => {
      if (paused || event.pointerType !== 'mouse' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      const bounds = event.currentTarget.getBoundingClientRect()
      stage.current?.style.setProperty('--pointer-x', `${((event.clientX - bounds.left) / bounds.width - .5) * 10}px`)
      stage.current?.style.setProperty('--pointer-y', `${((event.clientY - bounds.top) / bounds.height - .5) * 10}px`)
    }} onPointerLeave={() => {
      stage.current?.style.setProperty('--pointer-x', '0px')
      stage.current?.style.setProperty('--pointer-y', '0px')
    }}>
      <div className="core-parallax">
        <div className="core-coordinate coordinate-north">N / 00.00°</div><div className="core-coordinate coordinate-east">90°</div><div className="core-coordinate coordinate-west">270°</div>
        <RadialGeometry className="core-geometry" />
        <svg className="core-network" viewBox="0 0 600 600" fill="none" aria-hidden="true">
          <path className="mesh-line" d="M300 71 499 185 499 415 300 529 101 415 101 185Z M101 185 499 415M499 185 101 415M300 71v458M101 185h398M101 415h398" />
          <g className="packet-lines"><path d="M101 185 300 300 499 415" /><path d="M499 185 300 300 101 415" /><path d="M300 71v458" /></g>
          {[0, 1, 2, 3, 4, 5].map((i) => <g key={i} transform={`rotate(${i * 60} 300 300)`}><circle cx="300" cy="71" r="4" /><path d="M292 71h-14m44 0h-14" /></g>)}
        </svg>
        <div className="hud-ring hud-ring-outer" /><div className="hud-ring hud-ring-ticks" /><div className="hud-ring hud-ring-inner" />
        <div className="radar-sweep" /><div className="scan-wave wave-one" /><div className="scan-wave wave-two" />
        <div className="data-orbit data-orbit-one"><i /></div><div className="data-orbit data-orbit-two"><i /></div>
        <div className="ai-core">
          <span className="core-top-label">HUMAN-GOVERNED</span>
          <div className="core-emblem"><AgentIcon kind="manager" /></div>
          <strong>AI SECURITY<br />CORE</strong>
          <span className="core-online"><i className="status-dot" /> ALL SYSTEMS ALIGNED</span>
          <span className="core-id">NMRK / INTELLIGENCE ENGINE</span>
        </div>
        {agents.map((agent, i) => <div className={`agent-orbit orbit-${i}`} key={agent.kind}>
          <div className="orbit-anchor"><button className={`orbit-module module-${agent.kind}${selected === agent.kind ? ' is-selected' : ''}`} onClick={() => setSelected(agent.kind)} aria-pressed={selected === agent.kind} aria-label={`Inspect ${agent.name} agent`}>
            <span className="orbit-module-top"><span>{agent.number} / AGENT</span><i /></span>
            <span className="orbit-module-main"><AgentIcon kind={agent.kind} /><strong>{agent.name}</strong></span>
            <span className="orbit-module-status">{['SCANNING SURFACE', 'CONNECTING SIGNALS', 'VALIDATING EVIDENCE', 'BUILDING AUDIT TRAIL'][i]}</span>
          </button></div>
        </div>)}
        <div className="floating-panel panel-monitor"><span className="panel-icon"><FeatureIcon name="targets" /></span><div><small>PERIMETER STATUS</small><strong>Threat Monitoring Active</strong><span className="mini-bars"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></span></div><i className="status-dot" /></div>
        <div className="floating-panel panel-verification"><span className="panel-icon"><FeatureIcon name="verify" /></span><div><small>EVIDENCE ENGINE</small><strong>Verification Running</strong><span className="panel-progress"><i /></span></div></div>
        <div className="floating-panel panel-audit"><span className="panel-icon"><FeatureIcon name="audit" /></span><div><small>EVERY ACTION. ACCOUNTED FOR.</small><strong>Audit Trail Enabled</strong></div><i className="status-dot" /></div>
        <div className="authorization-pill"><FeatureIcon name="compliance" /> Authorization Confirmed <span>HUMAN APPROVED</span></div>
        <div className="core-particles" aria-hidden="true">{Array.from({ length: 16 }, (_, i) => <i key={i} />)}</div>
      </div>
    </div>
    <div className="command-readout" aria-live="polite"><span className="readout-icon"><AgentIcon kind={selected} /></span><div><strong>{active ? `${active.name} Agent` : 'Intelligence, orchestrated.'}</strong><span>{active ? active.detail : 'Four specialists. One mission. Your control.'}</span></div><button className="core-reset" onClick={() => setSelected('manager')} aria-label="Reset agent selection"><ArrowIcon /></button></div>
    <div className="command-bottomline"><span><i className="status-dot" /> ILLUSTRATIVE SYSTEM PREVIEW</span><button onClick={() => setPaused(!paused)} aria-pressed={paused}>{paused ? 'RESUME MOTION' : 'PAUSE MOTION'}<svg viewBox="0 0 12 12" aria-hidden="true">{paused ? <path d="m3 2 7 4-7 4Z" fill="currentColor" /> : <path d="M4 2v8m4-8v8" stroke="currentColor" strokeWidth="2" />}</svg></button></div>
  </div>
}

function NetworkVisual({ idPrefix = 'hero' }: { idPrefix?: string }) {
  return (
    <div className="network-frame" aria-label="Manager Agent coordinates Recon, Analysis, Verification, and Reporting agents">
      <div className="network-grid" />
      <div className="network-head">
        <span className="network-head-label"><span className="live-dot" /> LIVE ORCHESTRATION</span>
        <span className="network-head-right">NIRMARAKSH / 001 <span className="head-cross">+</span></span>
      </div>

      <div className="network-stage">
        <div className="ambient-orbit orbit-one" />
        <div className="ambient-orbit orbit-two" />
        <svg className="connections" viewBox="0 0 680 540" preserveAspectRatio="none" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id={`${idPrefix}-lineGradient`} x1="130" y1="80" x2="550" y2="460" gradientUnits="userSpaceOnUse">
              <stop stopColor="#4c99a8" stopOpacity=".3" />
              <stop offset=".48" stopColor="#8becff" stopOpacity=".9" />
              <stop offset="1" stopColor="#45B7C9" stopOpacity=".45" />
            </linearGradient>
            <filter id={`${idPrefix}-lineGlow`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5" /></filter>
          </defs>
          <g stroke={`url(#${idPrefix}-lineGradient)`} strokeWidth="2" filter={`url(#${idPrefix}-lineGlow)`} opacity=".7">
            <path d="M310 246 C277 216 242 159 184 149" /><path d="M370 246 C403 216 438 159 496 149" />
            <path d="M310 302 C275 340 239 399 184 409" /><path d="M370 302 C405 340 441 399 496 409" />
          </g>
          <g stroke={`url(#${idPrefix}-lineGradient)`} strokeWidth="1.5" strokeLinecap="round">
            <path className="flow-line" d="M310 246 C277 216 242 159 184 149" /><path className="flow-line flow-delay-1" d="M370 246 C403 216 438 159 496 149" />
            <path className="flow-line flow-delay-2" d="M310 302 C275 340 239 399 184 409" /><path className="flow-line flow-delay-3" d="M370 302 C405 340 441 399 496 409" />
          </g>
          <g fill="#a7f0ff"><circle cx="276" cy="204" r="2.5" /><circle cx="404" cy="204" r="2.5" /><circle cx="276" cy="348" r="2.5" /><circle cx="404" cy="348" r="2.5" /></g>
        </svg>

        {agents.map((agent) => (
          <div className={`agent-card agent-${agent.kind}`} key={agent.kind}>
            <span className="agent-icon"><AgentIcon kind={agent.kind} /></span>
            <span className="agent-copy"><strong>{agent.name}</strong><span>{agent.detail}</span></span>
            <span className="agent-number">{agent.number}</span>
          </div>
        ))}

        <div className="manager-card">
          <div className="manager-halo" />
          <div className="manager-icon"><AgentIcon kind="manager" /></div>
          <span className="manager-label">THE ORCHESTRATOR</span>
          <strong>Manager Agent</strong>
          <span className="manager-status"><span /> Coordinating agents</span>
        </div>
      </div>

      <div className="network-footer">
        <span><span className="footer-signal" /> SYSTEM OPERATIONAL</span>
        <span>HUMAN IN THE LOOP <span className="footer-slash">/</span> ALWAYS</span>
      </div>
    </div>
  )
}

function DemoDialog({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(true)

  useEffect(() => {
    if (!playing) return
    const interval = window.setInterval(() => setStep((current) => (current + 1) % demoSteps.length), 3200)
    return () => window.clearInterval(interval)
  }, [playing])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="demo-dialog" role="dialog" aria-modal="true" aria-labelledby="demo-title">
        <div className="dialog-top"><span className="eyebrow"><span className="eyebrow-line" /> PRODUCT WALKTHROUGH</span><button className="close-button" onClick={onClose} aria-label="Close demo">×</button></div>
        <h2 id="demo-title">See the agents in action.</h2>
        <p>One coordinated workflow. Every step visible, verifiable, and under your control.</p>
        <div className="demo-screen">
          <div className="demo-screen-top"><span><span className="live-dot" /> LIVE WORKFLOW</span><span>STEP 0{step + 1} / 04</span></div>
          <div className="demo-center-icon"><AgentIcon kind={agents[step].kind} /></div>
          <span className="demo-agent-name">{demoSteps[step].agent}</span>
          <h3>{demoSteps[step].title}</h3>
          <p>{demoSteps[step].description}</p>
          <div className="demo-step-track">{demoSteps.map((item, index) => <button key={item.agent} className={index === step ? 'active' : ''} onClick={() => { setStep(index); setPlaying(false) }} aria-label={`Show ${item.agent} step`} />)}</div>
        </div>
        <div className="dialog-bottom"><span>Guided product preview</span><button onClick={() => setPlaying(!playing)}>{playing ? 'Pause preview' : 'Play preview'} <ArrowIcon /></button></div>
      </section>
    </div>
  )
}

type AuthScenario = 'success' | 'invalid' | 'unauthorized' | 'denied'

const authSteps = [
  { title: 'Login', detail: 'A user initiates a session from the workspace sign-in page.', icon: 'targets' as FeatureIconName },
  { title: 'Credential Validation', detail: 'The identity and submitted credentials are checked against access policy.', icon: 'approval' as FeatureIconName },
  { title: 'OTP Generation', detail: 'A one-time passcode is created for the verified identity.', icon: 'execute' as FeatureIconName },
  { title: 'OTP Verification', detail: 'The submitted one-time passcode is checked before the session continues.', icon: 'verify' as FeatureIconName },
  { title: 'Approval Validation', detail: 'Workspace permissions and required human approvals are confirmed.', icon: 'compliance' as FeatureIconName },
  { title: 'Audit Log', detail: 'The outcome and decision path are recorded for review.', icon: 'audit' as FeatureIconName },
  { title: 'Workspace Access', detail: 'An authorized session enters the security workspace.', icon: 'understand' as FeatureIconName },
]

const authErrors: Record<Exclude<AuthScenario, 'success'>, { step: number; label: string; detail: string }> = {
  unauthorized: { step: 1, label: 'Unauthorized User', detail: 'Identity not permitted. The attempt is stopped and recorded.' },
  invalid: { step: 3, label: 'Invalid OTP', detail: 'The code is rejected. The user must retry verification.' },
  denied: { step: 4, label: 'Access Denied', detail: 'Required approval is missing. Workspace entry is blocked.' },
}

function AuthFlow() {
  const [scenario, setScenario] = useState<AuthScenario>('success')
  const [selectedStep, setSelectedStep] = useState(6)
  const stopAt = scenario === 'success' ? 6 : authErrors[scenario].step

  function selectScenario(next: AuthScenario) {
    setScenario(next)
    setSelectedStep(next === 'success' ? 6 : authErrors[next].step)
  }

  return <div className="auth-console">
    <div className="auth-console-header"><span><span className="live-dot" /> AUTHENTICATION / DECISION TREE</span><span>FLOW ID: 2FA-001 <span className="console-header-cross">+</span></span></div>
    <div className="auth-toolbar"><div><span className="auth-toolbar-label">EXPLORE A PATH</span><p>Select a scenario to trace its outcome.</p></div><div className="scenario-tabs" role="group" aria-label="Authentication scenario">
      {([['success', 'Successful login'], ['invalid', 'Invalid OTP'], ['unauthorized', 'Unauthorized user'], ['denied', 'Access denied']] as const).map(([value, label]) => <button key={value} className={scenario === value ? `selected ${value === 'success' ? '' : 'error-selected'}` : ''} aria-pressed={scenario === value} onClick={() => selectScenario(value)}>{label}</button>)}
    </div></div>
    <div className="auth-chart-scroll"><div className="auth-chart">
      {authSteps.map((step, index) => <button key={step.title} onClick={() => setSelectedStep(index)} className={`auth-node ${index <= stopAt ? 'on-path' : ''} ${selectedStep === index ? 'inspected' : ''} ${index === stopAt && scenario !== 'success' ? 'failed-node' : ''}`} style={{ gridColumn: index + 1, gridRow: 1 }} aria-pressed={selectedStep === index}>
        <span className="auth-node-top"><span className="auth-node-icon"><FeatureIcon name={step.icon} /></span><span>0{index + 1}</span></span><strong>{step.title}</strong><span className="auth-node-state">{index > stopAt ? 'NOT REACHED' : index === stopAt && scenario !== 'success' ? 'CHECK FAILED' : 'VALIDATED'}</span>
      </button>)}
      {(['unauthorized', 'invalid', 'denied'] as const).map((error) => <button key={error} className={`auth-error ${scenario === error ? 'active' : ''}`} style={{ gridColumn: authErrors[error].step + 1, gridRow: 2 }} onClick={() => selectScenario(error)} aria-pressed={scenario === error}>
        <span className="auth-error-link" /><span className="auth-error-title"><span>×</span> {authErrors[error].label}</span><small>{error === 'invalid' ? 'RETRY REQUIRED' : 'SESSION BLOCKED'}</small>
      </button>)}
    </div></div>
    <div className="auth-readout"><div><span className="auth-readout-kicker">INSPECTING / 0{selectedStep + 1}</span><strong>{authSteps[selectedStep].title}</strong><p>{authSteps[selectedStep].detail}</p></div><div className={`auth-outcome ${scenario === 'success' ? 'is-success' : ''}`}><span>{scenario === 'success' ? 'PATH COMPLETE' : 'EXCEPTION PATH'}</span><strong>{scenario === 'success' ? 'Access granted' : authErrors[scenario].label}</strong><small>{scenario === 'success' ? 'Identity verified · Decision logged' : authErrors[scenario].detail}</small></div></div>
  </div>
}

type WorkspaceView = 'overview' | 'findings' | 'reports' | 'audit'

const workspaceMenu: { view: WorkspaceView; label: string; icon: FeatureIconName }[] = [
  { view: 'overview', label: 'Overview', icon: 'understand' },
  { view: 'findings', label: 'Findings', icon: 'analyze' },
  { view: 'reports', label: 'Reports', icon: 'audit' },
  { view: 'audit', label: 'Audit logs', icon: 'compliance' },
]

function WorkspacePreview() {
  const [view, setView] = useState<WorkspaceView>('overview')
  const show = (panel: WorkspaceView) => view === 'overview' || view === panel

  return <div className="workspace-window" aria-label="Interactive sample of the Nirmaraksh security workspace">
    <aside className="workspace-sidebar">
      <div className="workspace-sidebar-brand"><span>Nirmaraksh</span></div>
      <div className="workspace-switcher"><span className="workspace-avatar">A</span><div><strong>Atlas workspace</strong><small>DEMO ENVIRONMENT</small></div><span className="switcher-chevron">⌄</span></div>
      <span className="sidebar-group-label">WORKSPACE</span>
      <nav aria-label="Workspace preview panels">{workspaceMenu.map((item) => <button key={item.view} onClick={() => setView(item.view)} className={view === item.view ? 'active' : ''} aria-current={view === item.view ? 'page' : undefined}><FeatureIcon name={item.icon} />{item.label}{item.view === 'findings' && <span className="sidebar-count">03</span>}</button>)}</nav>
      <div className="sidebar-divider" /><span className="sidebar-group-label">OPERATIONS</span><div className="sidebar-static"><AgentIcon kind="manager" /> Agent network</div><div className="sidebar-static"><FeatureIcon name="targets" /> Scope & targets</div>
      <div className="sidebar-bottom"><span className="sidebar-online" /> All systems operational</div>
    </aside>
    <div className="workspace-body">
      <div className="workspace-topbar"><span>Workspace <span>/</span> <strong>{workspaceMenu.find((item) => item.view === view)?.label}</strong></span><div><span className="workspace-topbar-status"><span className="live-dot" /> MISSION ACTIVE</span><span className="workspace-user">SC</span></div></div>
      <div className="workspace-content">
        <div className="workspace-title-row"><div><span className="workspace-overline">SECURITY OPERATIONS / LIVE VIEW</span><h3>{view === 'overview' ? 'Mission control' : workspaceMenu.find((item) => item.view === view)?.label}</h3><p>Visibility across every agent, action, and decision.</p></div><span className="workspace-time">DEMO DATA <span>·</span> SESSION 001</span></div>
        <div className="workspace-stat-row"><div><span>ACTIVE AGENTS</span><strong>05<span> / 05</span></strong></div><div><span>ASSETS IN SCOPE</span><strong>24</strong></div><div><span>FINDINGS TO REVIEW</span><strong>03</strong></div><div><span>APPROVALS PENDING</span><strong>01</strong></div></div>
        <div className="workspace-agents"><div className="workspace-agents-header"><strong>Agent status</strong><span><span className="live-dot" /> ALL CONNECTED</span></div><div className="workspace-agent-row">{(['manager', 'recon', 'analysis', 'verification', 'reporting'] as const).map((agent) => <div className="workspace-agent" key={agent}><span className="workspace-agent-icon"><AgentIcon kind={agent} /></span><span>{agent === 'manager' ? 'Manager' : agent[0].toUpperCase() + agent.slice(1)}</span><i /></div>)}</div></div>
        <div className={`workspace-widgets ${view !== 'overview' ? 'focused' : ''}`}>
          {view === 'overview' && <div className="workspace-widget widget-activity"><div className="widget-heading"><h4>Activity feed</h4><span>LIVE UPDATES</span></div><div className="feed-list"><div><i className="feed-dot violet" /><span><strong>Manager Agent</strong> assigned validation to Verification Agent<small>2 MIN AGO · AUTOMATED</small></span></div><div><i className="feed-dot teal" /><span><strong>Recon Agent</strong> completed asset discovery<small>8 MIN AGO · 24 ASSETS</small></span></div><div><i className="feed-dot muted" /><span><strong>Approval gate</strong> awaiting human review<small>14 MIN AGO · ACTION REQUIRED</small></span></div></div></div>}
          {show('findings') && <div className="workspace-widget widget-findings"><div className="widget-heading"><h4>Findings</h4><span>03 IN REVIEW</span></div><div className="finding-list"><div><span className="finding-severity high">HIGH</span><span><strong>Exposed staging endpoint</strong><small>api.staging.example · Verified</small></span><span className="finding-arrow">↗</span></div><div><span className="finding-severity medium">MED</span><span><strong>Outdated TLS configuration</strong><small>edge.example · In review</small></span><span className="finding-arrow">↗</span></div><div><span className="finding-severity low">LOW</span><span><strong>Access policy drift</strong><small>workspace policy · Needs approval</small></span><span className="finding-arrow">↗</span></div></div></div>}
          {show('reports') && <div className="workspace-widget widget-reports"><div className="widget-heading"><h4>Reports</h4><span>02 GENERATED</span></div><div className="report-list"><div><span className="report-file"><FeatureIcon name="audit" /></span><span><strong>Attack surface summary</strong><small>Today · PDF ready</small></span><span className="report-ready">READY</span></div><div><span className="report-file"><FeatureIcon name="audit" /></span><span><strong>Verification brief</strong><small>Yesterday · PDF ready</small></span><span className="report-ready">READY</span></div></div></div>}
          {show('audit') && <div className="workspace-widget widget-audit"><div className="widget-heading"><h4>Audit log</h4><span>TRACEABLE ACTIONS</span></div><div className="audit-list"><div><span>09:42:18</span><strong>Finding validated</strong><small>AGENT / VERIFICATION</small></div><div><span>09:36:04</span><strong>Scope confirmed</strong><small>HUMAN / APPROVED</small></div><div><span>09:31:52</span><strong>Scan initialized</strong><small>SYSTEM / MANAGER</small></div></div></div>}
          <div className="workspace-widget widget-terminal"><div className="widget-heading"><h4><span className="terminal-prompt">&gt;_</span> Security operations</h4><span><span className="terminal-led" /> SESSION ACTIVE</span></div><div className="terminal-lines"><p><span>operator@nirmaraksh</span>:~$ mission status --scope authorized</p><p><i>✓</i> Scope validated <span>24 authorized assets</span></p><p><i>✓</i> Agents synchronized <span>5 agents online</span></p><p><i>›</i> Awaiting approval <span>verification gate / 01</span></p><p className="terminal-cursor">_<span /></p></div></div>
        </div>
      </div>
    </div>
  </div>
}

function downloadOverview() {
  const overview = `NIRMARAKSH — THE AGENTIC SECURITY WORKSPACE\n\nAutonomous security testing powered by coordinated AI agents with human oversight.\n\nHOW IT WORKS\nThe Manager Agent coordinates four specialized agents in one transparent workflow:\n\n01  Recon — Surface discovery\n02  Analysis — Intelligent assessment\n03  Verification — Exploit validation\n04  Reporting — Actionable insights\n\n5 SPECIALIZED AGENTS  /  HUMAN CONTROLLED  /  FULL AUDIT TRAIL\n\nNirmaraksh brings autonomous execution and human judgment together in one security workspace.\n`
  const url = URL.createObjectURL(new Blob([overview], { type: 'text/plain' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'nirmaraksh-overview.txt'
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function App() {
  const [demoOpen, setDemoOpen] = useState(false)

  return (
    <div className="site-shell">
      <div className="page-glow page-glow-one" /><div className="page-glow page-glow-two" />
      <header className="site-header page-container">
        <a className="brand" href="#top" aria-label="Nirmaraksh home"><img className="brand-logo" src={nirmarakshLogo} alt="" /><span>Nirmaraksh</span></a>
        <nav className="desktop-nav" aria-label="Main navigation"><a href="#platform">Features</a><a href="#agents">Architecture</a><a href="#control">Security</a><a href="#demo">Demo</a><a href="#contact">Contact</a></nav>
        <button className="header-action" onClick={() => setDemoOpen(true)}>Get Started <ArrowIcon diagonal /></button>
      </header>

      <main id="top">
        <section className="hero cinematic-hero page-container" aria-labelledby="hero-title">
          <div className="hero-environment" aria-hidden="true"><div className="hero-cyber-grid" /><div className="hero-hex-mesh" /><RadialGeometry className="background-geometry" /><svg className="background-circuits" viewBox="0 0 1440 800" fill="none"><path d="M0 140h140l80 80h130M0 570h90l70-70h170M1440 150h-110l-75 75h-160M1440 630h-100l-95-95h-120M480 0v70l50 50v80M1000 800v-70l-60-60v-80" /><circle cx="350" cy="220" r="4" /><circle cx="330" cy="500" r="4" /><circle cx="1095" cy="225" r="4" /></svg></div>
          <div className="hero-copy">
            <div className="hero-badge"><span className="badge-symbol"><FeatureIcon name="compliance" /></span><span>Human-Controlled Agentic Security</span><i className="status-dot" /></div>
            <div className="hero-title-decoration" aria-hidden="true"><span /><svg viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="10" /><circle cx="16" cy="16" r="4" /><path d="M16 0v6m0 20v6M0 16h6m20 0h6" /></svg><span /><small>INTELLIGENCE WITH INTENTION</small></div>
            <h1 id="hero-title">Nirmaraksh<span className="headline-glyph" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="12" /><path d="M16 0v8m0 16v8M0 16h8m16 0h8" /><circle cx="16" cy="16" r="3" /></svg></span></h1>
            <p className="hero-subheadline">The Agentic{' '}<br /><span>Security Workspace</span></p>
            <p className="hero-description">Coordinate autonomous security agents across reconnaissance, analysis, verification, and reporting while maintaining complete human oversight, authorization controls, and auditability.</p>
            <div className="hero-trust">{['Multi-Agent Architecture', 'Human-in-the-Loop', 'Audit Trail', 'Authorized Targets Only'].map((label) => <span key={label}><svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m3 8 3 3 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>{label}</span>)}</div>
            <div className="hero-signature"><span className="signature-line" /><span>AUTONOMOUS BY DESIGN. <strong>ACCOUNTABLE BY DEFAULT.</strong></span></div>
          </div>
          <div className="hero-visual">
            <SecurityCore />
            <div className="hero-visual-actions">
              <button className="hero-glass-action hero-glass-start" onClick={() => setDemoOpen(true)}>
                <span className="hero-glass-icon"><AgentIcon kind="manager" /></span>
                <span className="hero-glass-copy"><small>ENTER THE WORKSPACE</small><strong>Get started</strong><em>Launch guided experience</em></span>
                <ArrowIcon diagonal />
              </button>
              <button className="hero-glass-action hero-glass-download" onClick={downloadOverview}>
                <span className="hero-glass-icon"><AgentIcon kind="reporting" /></span>
                <span className="hero-glass-copy"><small>SECURITY BRIEF</small><strong>Download overview</strong><em>TXT · READY</em></span>
                <ArrowIcon diagonal />
              </button>
            </div>
          </div>
          <div className="hero-bottom-strip"><span><span className="status-dot" /> THE NEXT ERA OF SECURITY OPERATIONS</span><a href="#platform">EXPLORE THE WORKSPACE <ArrowIcon /></a><span>01 — INTELLIGENCE LAYER</span></div>
        </section>

        <section className="metrics page-container" id="advantages" aria-label="Platform advantages">
          <div className="metrics-intro"><span className="tiny-plus">+</span> BUILT FOR SECURITY TEAMS<br />THAT THINK AHEAD</div>
          <div className="metric"><span className="metric-symbol">01 <span>↗</span></span><div><strong>5</strong><span>Specialized Agents</span></div></div>
          <div className="metric"><span className="metric-symbol">02 <span>↗</span></span><div><strong>Human</strong><span>Controlled</span></div></div>
          <div className="metric"><span className="metric-symbol">03 <span>↗</span></span><div><strong>Full</strong><span>Audit Trail</span></div></div>
        </section>

        <section className="content-section problem-section page-container" id="problem" aria-labelledby="problem-title">
          <div className="section-intro">
            <div><div className="eyebrow"><span className="eyebrow-line" /> 01 / THE PROBLEM</div><h2 id="problem-title">Security Testing<br />Is <span className="gradient-text">Fragmented.</span></h2></div>
            <p>More tools should mean more clarity. Instead, security teams are left stitching together disconnected signals and doing the heavy lifting by hand.</p>
          </div>
          <div className="problem-grid">
            {problems.map((problem) => <article className="problem-card" key={problem.number}>
              <div className="problem-card-top"><span className="section-card-icon"><FeatureIcon name={problem.icon} /></span><span className="card-index">/ {problem.number}</span></div>
              <div className="problem-card-graphic"><span /><span /><span /></div>
              <div className="problem-card-bottom"><span className="card-kicker">{problem.tag}</span><h3>{problem.title}</h3><p>{problem.description}</p></div>
            </article>)}
          </div>
          <div className="transformation" aria-label="Nirmaraksh turns disconnected tools into one unified security workflow">
            <div className="transformation-before"><span className="transform-label">THE OLD WAY</span><div className="loose-tools"><span>Recon</span><span>Findings</span><span>Validation</span></div><strong>Disconnected tools</strong></div>
            <div className="transformation-arrow"><span><ArrowIcon /></span></div>
            <div className="transformation-after"><div className="transform-after-head"><span className="transform-label">THE NIRMARAKSH WAY</span><AgentIcon kind="manager" /></div><div className="unified-track"><span>Discover</span><i /><span>Analyze</span><i /><span>Verify</span><i /><span>Report</span></div><strong>One unified workflow <ArrowIcon diagonal /></strong></div>
          </div>
        </section>

        <section className="content-section workflow-section" id="platform" aria-labelledby="workflow-title">
          <div className="page-container">
            <div className="section-intro">
              <div><div className="eyebrow"><span className="eyebrow-line" /> 02 / THE WORKFLOW</div><h2 id="workflow-title">How Nirmaraksh<br /><span className="gradient-text">Works.</span></h2></div>
              <p>From the first signal to the final finding, every phase moves together in a continuous, transparent workflow.</p>
            </div>
            <div className="workflow-grid">
              {workflow.map((phase) => <article className="workflow-card" key={phase.number}>
                <div className="workflow-connector" aria-hidden="true"><span /></div>
                <div className="workflow-card-top"><span className="workflow-icon"><FeatureIcon name={phase.icon} /></span><span className="card-index">{phase.number} / 05</span></div>
                <div><h3>{phase.title}</h3><p>{phase.description}</p></div>
              </article>)}
            </div>
            <div className="workflow-footnote"><span className="live-dot" /> ONE CONNECTED MISSION <span className="footnote-rule" /> HUMAN OVERSIGHT AT EVERY STEP</div>
          </div>
        </section>

        <section className="content-section architecture-section page-container" id="agents" aria-labelledby="architecture-title">
          <div className="section-intro architecture-intro">
            <div><div className="eyebrow"><span className="eyebrow-line" /> 03 / THE ARCHITECTURE</div><h2 id="architecture-title">Intelligence,<br /><span className="gradient-text">Orchestrated.</span></h2></div>
            <p>One manager. Four specialized agents. A coordinated system designed to turn complex security testing into clear, actionable outcomes.</p>
          </div>
          <div className="architecture-layout">
            <div className="architecture-visual"><NetworkVisual idPrefix="architecture" /></div>
            <div className="architecture-aside">
              <div className="aside-header"><span className="live-dot" /> SYSTEM OVERVIEW <span>05 / 05</span></div>
              <div className="aside-main"><div className="aside-brand"><AgentIcon kind="manager" /></div><span className="card-kicker">CENTRAL INTELLIGENCE</span><h3>One mission.<br />Five minds.</h3><p>The Manager Agent directs each specialist, carries context between stages, and keeps people in control of the process.</p></div>
              <div className="aside-list"><span><i /> 01 — RECON</span><span><i /> 02 — ANALYSIS</span><span><i /> 03 — VERIFICATION</span><span><i /> 04 — REPORTING</span></div>
              <div className="aside-footer">COORDINATED BY THE MANAGER AGENT <ArrowIcon diagonal /></div>
            </div>
          </div>
          <div className="architecture-caption"><span>FIG. 02 / MULTI-AGENT ARCHITECTURE</span><span>CONNECTED BY DESIGN. CONTROLLED BY YOU.</span></div>
        </section>

        <section className="content-section control-section" id="control" aria-labelledby="control-title">
          <div className="page-container">
            <div className="section-intro">
              <div><div className="eyebrow"><span className="eyebrow-line" /> 04 / BUILT FOR TRUST</div><h2 id="control-title">Human Controlled<br /><span className="gradient-text">Security.</span></h2></div>
              <p>Autonomous doesn't mean unchecked. Your team sets the boundaries, approves the actions, and has the evidence to back every decision.</p>
            </div>
            <div className="control-grid">
              {controls.map((control) => <article className="control-card" key={control.number}>
                <div className="control-card-top"><span className="control-icon"><FeatureIcon name={control.icon} /></span><span className="card-index">{control.number} / 04</span></div>
                <div><h3>{control.title}</h3><p>{control.description}</p></div>
                <span className="control-corner" aria-hidden="true">+</span>
              </article>)}
            </div>
            <div className="closing-line"><div><AgentIcon kind="manager" /><span>Powerful agents. <strong>Your rules.</strong></span></div><button onClick={() => setDemoOpen(true)}>See Nirmaraksh in action <ArrowIcon diagonal /></button></div>
          </div>
        </section>

        <section className="content-section auth-section page-container" id="auth-flow" aria-labelledby="auth-title">
          <div className="section-intro"><div><div className="eyebrow"><span className="eyebrow-line" /> 05 / ACCESS CONTROL</div><h2 id="auth-title">Every access decision.<br /><span className="gradient-text">Accounted for.</span></h2></div><p>Explore how a two-factor sign-in moves through identity checks, human approval, and a complete audit trail—with clear exits when a check fails.</p></div>
          <AuthFlow />
          <div className="architecture-caption"><span>FIG. 03 / INTERACTIVE 2FA DECISION FLOW</span><span>SELECT A PATH TO EXPLORE THE OUTCOME.</span></div>
        </section>

        <section className="content-section workspace-section" id="workspace" aria-labelledby="workspace-title"><div className="page-container">
          <div className="section-intro"><div><div className="eyebrow"><span className="eyebrow-line" /> 06 / THE WORKSPACE</div><h2 id="workspace-title">Everything in view.<br /><span className="gradient-text">Nothing in silos.</span></h2></div><p>Agents, findings, reports, and every decision live together in one focused command center. Explore the sample workspace below.</p></div>
          <WorkspacePreview />
          <div className="architecture-caption"><span>FIG. 04 / NIRMARAKSH WORKSPACE PREVIEW</span><span>ILLUSTRATIVE DEMO DATA · NOT A LIVE SCAN</span></div>
        </div></section>

        <section className="content-section demo-section page-container" id="demo" aria-labelledby="demo-section-title">
          <div className="demo-section-copy"><div className="eyebrow"><span className="eyebrow-line" /> 07 / SEE IT IN ACTION</div><h2 id="demo-section-title">Security work,<br /><span className="gradient-text">reimagined.</span></h2><p>See how coordinated agents take a mission from discovery to verified findings—with your team in control throughout.</p><button className="demo-text-link" onClick={() => setDemoOpen(true)}>Explore the interactive walkthrough <ArrowIcon diagonal /></button></div>
          <button className="demo-player" onClick={() => setDemoOpen(true)} aria-label="Open interactive product walkthrough"><span className="demo-player-top"><span><span className="live-dot" /> NIRMARAKSH / PRODUCT WALKTHROUGH</span><span>PREVIEW 01</span></span><span className="demo-player-scene"><span className="scene-orbit"><span className="scene-core"><AgentIcon kind="manager" /></span><span className="scene-satellite scene-one"><AgentIcon kind="recon" /></span><span className="scene-satellite scene-two"><AgentIcon kind="analysis" /></span><span className="scene-satellite scene-three"><AgentIcon kind="verification" /></span><span className="scene-satellite scene-four"><AgentIcon kind="reporting" /></span></span><span className="demo-play"><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m7 4.5 8 5.5-8 5.5v-11Z" fill="currentColor" /></svg></span></span><span className="demo-player-bottom"><span>THE AGENTIC SECURITY WORKSPACE</span><span className="player-timeline"><i /></span><span>GUIDED PREVIEW <ArrowIcon diagonal /></span></span></button>
        </section>

        <section className="content-section trust-section" id="trust" aria-labelledby="trust-title"><div className="page-container">
          <div className="section-intro"><div><div className="eyebrow"><span className="eyebrow-line" /> 08 / TRUST BY DESIGN</div><h2 id="trust-title">Built for confidence.<br /><span className="gradient-text">Not blind trust.</span></h2></div><p>Powerful automation belongs inside clear boundaries. These are the principles that shape every Nirmaraksh workflow.</p></div>
          <div className="trust-grid"><article><span className="trust-icon"><FeatureIcon name="approval" /></span><span className="card-index">01 / HUMAN AUTHORITY</span><h3>People make the call.</h3><p>Human approval stays at the points where judgment and authorization matter most.</p></article><article><span className="trust-icon"><FeatureIcon name="audit" /></span><span className="card-index">02 / VISIBLE ACTIONS</span><h3>Nothing disappears.</h3><p>Actions and decisions remain visible, so your team can review the path behind a finding.</p></article><article><span className="trust-icon"><FeatureIcon name="targets" /></span><span className="card-index">03 / CLEAR BOUNDARIES</span><h3>Scope comes first.</h3><p>Define authorized targets before work begins and keep the mission within those boundaries.</p></article></div>
        </div></section>

        <section className="final-cta page-container" aria-labelledby="final-title"><div className="final-cta-glow" /><div className="final-cta-content"><div className="eyebrow"><span className="eyebrow-line" /> A MORE INTELLIGENT WAY FORWARD</div><h2 id="final-title">Your security team.<br /><span className="gradient-text">A new advantage.</span></h2><p>Bring autonomous execution and human judgment together in one workspace.</p><div className="final-actions"><button className="button-primary" onClick={() => setDemoOpen(true)}>Explore the demo <ArrowIcon diagonal /></button><button className="button-secondary" onClick={downloadOverview}>Download overview <ArrowIcon diagonal /></button></div></div></section>
      </main>
      <footer className="site-footer" id="contact"><div className="page-container"><div className="footer-main"><div className="footer-brand-block"><a className="brand" href="#top" aria-label="Nirmaraksh home"><span>Nirmaraksh</span></a><p>Autonomous security testing.<br />Human oversight, always.</p><span className="footer-brand-caption">THE AGENTIC SECURITY WORKSPACE</span></div><div className="footer-column"><h3>Explore</h3><a href="#problem">The challenge</a><a href="#platform">How it works</a><a href="#agents">Agent architecture</a><a href="#workspace">Workspace preview</a></div><div className="footer-column"><h3>Security</h3><a href="#control">Human control</a><a href="#auth-flow">2FA flow</a><a href="#trust">Trust by design</a></div><div className="footer-column"><h3>Get started</h3><a href="#demo">Product walkthrough</a><button onClick={() => setDemoOpen(true)}>Interactive demo</button><button onClick={downloadOverview}>Download overview</button></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} NIRMARAKSH. DESIGNED FOR THE NEXT ERA OF SECURITY.</span><a href="#top">BACK TO TOP ↑</a></div></div></footer>
      {demoOpen && <DemoDialog onClose={() => setDemoOpen(false)} />}
    </div>
  )
}
