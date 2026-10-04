export const problems = [
  { number: '01', icon: 'isolated', title: 'Recon Tools Are Isolated', description: 'Discovery happens in silos. Context gets lost before testing even begins.', tag: 'DISCONNECTED SIGNALS' },
  { number: '02', icon: 'scattered', title: 'Findings Are Scattered', description: 'Critical evidence lives across dashboards, documents, and disconnected teams.', tag: 'FRAGMENTED CONTEXT' },
  { number: '03', icon: 'manual', title: 'Verification Is Manual', description: 'Analysts spend valuable time triaging noise instead of validating real risk.', tag: 'SLOWER DECISIONS' },
]

export const workflow = [
  { number: '01', icon: 'understand', title: 'Understand', description: 'Map your environment and define the mission.' },
  { number: '02', icon: 'plan', title: 'Plan', description: 'Set the scope, priorities, and guardrails.' },
  { number: '03', icon: 'execute', title: 'Execute', description: 'Specialized agents work in coordination.' },
  { number: '04', icon: 'analyze', title: 'Analyze', description: 'Connect evidence and surface what matters.' },
  { number: '05', icon: 'verify', title: 'Verify', description: 'Confirm findings with human oversight.' },
]

export const controls = [
  { number: '01', icon: 'approval', title: 'Approval Gates', description: 'Put a human decision at every critical step before agents move forward.' },
  { number: '02', icon: 'audit', title: 'Audit Trail', description: 'Keep a clear record of actions, evidence, and decisions from start to finish.' },
  { number: '03', icon: 'targets', title: 'Authorized Targets', description: 'Keep testing focused on the assets and boundaries your team approves.' },
  { number: '04', icon: 'compliance', title: 'Compliance Ready', description: 'Make oversight and accountability part of the workflow, not an afterthought.' },
]


export const heroTrustPoints = ['Multi-Agent Architecture', 'Human-in-the-Loop', 'Audit Trail', 'Authorized Targets Only']

export const metrics = [
  { number: '01', value: '5', label: 'Specialized Agents' },
  { number: '02', value: 'Human', label: 'Controlled' },
  { number: '03', value: 'Full', label: 'Audit Trail' },
]

export const trustPrinciples = [
  { icon: 'approval', index: '01 / HUMAN AUTHORITY', title: 'People make the call.', description: 'Human approval stays at the points where judgment and authorization matter most.' },
  { icon: 'audit', index: '02 / VISIBLE ACTIONS', title: 'Nothing disappears.', description: 'Actions and decisions remain visible, so your team can review the path behind a finding.' },
  { icon: 'targets', index: '03 / CLEAR BOUNDARIES', title: 'Scope comes first.', description: 'Define authorized targets before work begins and keep the mission within those boundaries.' },
]
