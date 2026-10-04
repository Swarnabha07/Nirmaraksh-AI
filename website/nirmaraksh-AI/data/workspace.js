export const workspaceMenu = [
  { view: 'overview', label: 'Overview', icon: 'understand' },
  { view: 'findings', label: 'Findings', icon: 'analyze' },
  { view: 'reports', label: 'Reports', icon: 'audit' },
  { view: 'audit', label: 'Audit logs', icon: 'compliance' },
]


export const workspaceAgentKinds = ['manager', 'recon', 'analysis', 'verification', 'reporting']

export const workspaceStats = [
  { label: 'ACTIVE AGENTS', value: '05', suffix: ' / 05' },
  { label: 'ASSETS IN SCOPE', value: '24' },
  { label: 'FINDINGS TO REVIEW', value: '03' },
  { label: 'APPROVALS PENDING', value: '01' },
]

export const workspaceFeed = [
  { tone: 'violet', actor: 'Manager Agent', text: 'assigned validation to Verification Agent', meta: '2 MIN AGO · AUTOMATED' },
  { tone: 'teal', actor: 'Recon Agent', text: 'completed asset discovery', meta: '8 MIN AGO · 24 ASSETS' },
  { tone: 'muted', actor: 'Approval gate', text: 'awaiting human review', meta: '14 MIN AGO · ACTION REQUIRED' },
]

export const workspaceFindings = [
  { severity: 'high', label: 'HIGH', title: 'Exposed staging endpoint', meta: 'api.staging.example · Verified' },
  { severity: 'medium', label: 'MED', title: 'Outdated TLS configuration', meta: 'edge.example · In review' },
  { severity: 'low', label: 'LOW', title: 'Access policy drift', meta: 'workspace policy · Needs approval' },
]

export const workspaceReports = [
  { title: 'Attack surface summary', meta: 'Today · PDF ready' },
  { title: 'Verification brief', meta: 'Yesterday · PDF ready' },
]

export const workspaceAudit = [
  { time: '09:42:18', title: 'Finding validated', source: 'AGENT / VERIFICATION' },
  { time: '09:36:04', title: 'Scope confirmed', source: 'HUMAN / APPROVED' },
  { time: '09:31:52', title: 'Scan initialized', source: 'SYSTEM / MANAGER' },
]
