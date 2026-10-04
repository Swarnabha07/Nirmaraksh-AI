# Skill: Pentest Helper — Confirmed-Findings Methodology

## Scope & authorization
Only run these scans against targets you own or are explicitly authorized to
test (a CTF box, a lab VM, your own infrastructure, or a target with signed
written authorization). This skill governs *how findings get reported*, not
whether a scan is permitted — `pentest_helper.py`'s `authorized` flag is the
gate for that and must stay enforced regardless of any change made here.

## The actual root cause of the false positives
`_extract_findings()` currently flags a line as a "finding" if it contains
**any** of these substrings:

```
"vulnerable", "[critical]", "[high]", "[medium]", "[low]", "cve-",
"identified", "sql injection", "open port", "password found", "login",
"match", "found", "discovered", "running:", "os:", "server:",
"x-powered-by", "allow:", "interesting", "potential", "exposed",
"backup", "admin", "200 ok", "401", "403", "allow",
```

This is naive substring matching over **raw, unstructured tool stdout** —
it has no concept of what each tool actually confirmed versus what it merely
printed as routine output. Nearly every normal scan line contains one of
these words: an `nmap` service banner line contains `"server:"`; a `nikto`
progress line contains `"admin"` because it's testing a path called
`/admin/`; an ordinary successful page load is a `"200 ok"`. The method
guarantees a wall of "findings" on almost any target, confirmed or not —
that's the whole problem, not a tuning issue.

**The fix is not a better keyword list.** It's replacing keyword-matching
with **per-tool structured parsing**, because each tool already tells you,
in its own output format, whether something is confirmed, likely, or purely
informational — the wrapper is just throwing that signal away.

## The pattern to copy: your own custom checks already do this right
`_check_http_headers`, `_check_http_methods`, and `_check_ssl` don't use
keyword matching at all — they check real boolean conditions:
- a security header is either present in `r.headers` or it isn't
- `TRACE` either returns `200` (enabled) or it doesn't
- a cert either parses and has a given `notAfter` date or the handshake fails

That's the model for every tool in this file. A "finding" should come from
**evaluating a specific condition against structured or reliably-anchored
output**, never from "this line looked scary."

## Confidence taxonomy — every finding must be labeled
| Label | Meaning | Example |
|---|---|---|
| **CONFIRMED** | The tool itself proved exploitation or a definite state | sqlmap's own "the following injection point(s)... is vulnerable" summary; nmap NSE `VULNERABLE:` marker; hydra's `[host] login: X   password: Y` success line |
| **LIKELY — needs manual verification** | The tool flagged a possibility but did not confirm | nmap NSE `State: LIKELY VULNERABLE`; nikto's own low-confidence OSVDB notes; a service banner matching a vulnerable version string with no exploit attempted |
| **INFORMATIONAL** | Reconnaissance data, not a vulnerability | open port list, detected technology stack (whatweb), TLS version, HTTP headers present |

A report must never present LIKELY or INFORMATIONAL items as CONFIRMED.
Reword: "Detected Apache 2.4.49 (matches a known CVE range — not yet
verified against this target)" rather than "Vulnerable to CVE-2021-41773."

## Tool-by-tool parsing rules (replaces the shared keyword pass)

**nmap NSE vuln scripts** (`vuln_script_scan`, `cve_scan`)
- Only mark CONFIRMED on an explicit `VULNERABLE:` line in the script's own
  output block.
- `State: LIKELY VULNERABLE` → LIKELY, always append "not exploited/confirmed."
- Plain port/service/version lines from `-sV` → INFORMATIONAL only.

**nikto**
- Nikto prefixes items with an OSVDB/reference ID and its own wording
  ("might be interesting," "potentially," "is not recommended"). Preserve
  nikto's own hedge language into the LIKELY bucket — never re-flatten it
  into an unqualified "vulnerable."
- A plain 200/403/401 response to a probed path is INFORMATIONAL, not a
  finding, unless nikto itself flags the specific response as notable.

**sqlmap**
- CONFIRMED only on sqlmap's actual summary block (the lines starting
  "sqlmap identified the following injection point(s)" or "Parameter: ...
  is vulnerable"). Every other line — the request-by-request testing
  progress — must be discarded, not scanned for keywords.
- If sqlmap's run ends without that summary block, the correct report is
  "No injection confirmed" — not silence, and not a vague "potential" hit.

**hydra (`brute_ssh`, `brute_ftp`)**
- CONFIRMED only on hydra's own explicit success line format
  (`[PORT][service] host: <ip>   login: <user>   password: <pass>`).
- A completed run with no such line is "no valid credentials found in this
  wordlist" — report that explicitly rather than reporting nothing.

**whatweb / tech_detect, whois, dns, subdomain_enum, osint**
- These are always INFORMATIONAL. Never route their output through a
  vulnerability-style finding at all — they answer "what is this," not
  "what is wrong with it."

**HTTP header / method / SSL checks (already correct)**
- Keep as-is; use as the reference implementation for every other check.

## Reporting format requirement
Every line under "FINDINGS" must carry three things, not just a quoted
snippet:
```
[CONFIRMED] sqlmap: Parameter 'id' is vulnerable (boolean-based blind)
  Evidence: <exact sqlmap summary line>
[LIKELY]    nmap vuln script: State: LIKELY VULNERABLE (CVE-2021-XXXXX)
  Evidence: <exact NSE output line> — not exploited, verify manually
[INFO]      whatweb: Apache/2.4.49, PHP/8.1
```
If a finding can't cite the tool and the exact source line it came from, it
doesn't get reported. No confidence label may be inferred from tone or
wording alone — only from the tool's own documented output contract above.

## Optional second pass: a verifier before the report is finalized
For an extra layer of rigor (and a good "self-correction" story if this
ties into the sub-agent work), a lightweight verifier step can review the
structured findings list against the raw tool output one more time before
the report is written, and downgrade or drop anything that doesn't actually
match its cited evidence line. This reuses the same `BaseAgent` pattern
already in `agents/base.py` — it does not need new infrastructure, just a
narrow role prompt ("does this evidence line actually support this
label — yes/no/downgrade").

## What NOT to do
- Do not infer "vulnerable" from a version number alone without the tool's
  own CVE/exploit confirmation mechanism actually running and matching.
- Do not merge tool-specific output into one shared keyword pass ever again
  — each tool's parser must be separate and match that tool's own format.
- Do not drop the `authorized` gate or soften scope enforcement while
  improving report accuracy — these are unrelated concerns and both matter.