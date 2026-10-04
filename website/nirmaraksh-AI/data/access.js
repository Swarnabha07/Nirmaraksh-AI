export const authSteps = [
  { title: 'Login', detail: 'A user initiates a session from the workspace sign-in page.', icon: 'targets' },
  { title: 'Credential Validation', detail: 'The identity and submitted credentials are checked against access policy.', icon: 'approval' },
  { title: 'OTP Generation', detail: 'A one-time passcode is created for the verified identity.', icon: 'execute' },
  { title: 'OTP Verification', detail: 'The submitted one-time passcode is checked before the session continues.', icon: 'verify' },
  { title: 'Approval Validation', detail: 'Workspace permissions and required human approvals are confirmed.', icon: 'compliance' },
  { title: 'Audit Log', detail: 'The outcome and decision path are recorded for review.', icon: 'audit' },
  { title: 'Workspace Access', detail: 'An authorized session enters the security workspace.', icon: 'understand' },
]

export const authErrors = {
  unauthorized: { step: 1, label: 'Unauthorized User', detail: 'Identity not permitted. The attempt is stopped and recorded.' },
  invalid: { step: 3, label: 'Invalid OTP', detail: 'The code is rejected. The user must retry verification.' },
  denied: { step: 4, label: 'Access Denied', detail: 'Required approval is missing. Workspace entry is blocked.' },
}


export const authScenarios = [
  { value: 'success', label: 'Successful login' },
  { value: 'invalid', label: 'Invalid OTP' },
  { value: 'unauthorized', label: 'Unauthorized user' },
  { value: 'denied', label: 'Access denied' },
]
