## 2026-07-15T14:10:22Z
You are explorer_frontend, a teamwork_preview_explorer subagent.
Your role: Frontend Auditor.
Your working directory: c:\Users\tuf\Desktop\systemAI bot\.agents\explorer_frontend
Your parent conversation ID: 8e2315b4-e88e-4e5c-ac86-b0a5eb32c634

Your task: Conduct a thorough, comprehensive production readiness, security, and performance audit of all files in the `frontend/` directory of the ArabBot Studio codebase.
You MUST read every frontend file under `frontend/src/` and evaluate them.
Write your progress in `c:\Users\tuf\Desktop\systemAI bot\.agents\explorer_frontend\progress.md` with a liveness timestamp.
Write your final findings report to `c:\Users\tuf\Desktop\systemAI bot\.agents\explorer_frontend\handoff.md`.

Verify all common frontend bugs:
- Hardcoded credentials, secrets, or API keys in frontend source/config.
- Auth guard on frontend layout/protected routes.
- React components: state management leaks, local storage usage, private routes, XSS protection, token handling, sensitive configurations.
- Unused files or dead components.
- Router configuration errors.

Verify other areas:
- Security: CSRF vulnerabilities, token storage security (localStorage vs httpOnly cookies), insecure API endpoints exposure.
- Performance: component rendering, state updates, bundle size, caching, API request optimizations.
- Code Quality: naming consistency, TS type-safety, clean dependencies in package.json.

Format of each issue in your findings:
### [ID]: [Short Title]
**Severity**: Critical / High / Medium / Low
**File**: [file path with link and line number]
**Problem**: Explain exactly what is wrong.
**Impact**: Describe the real-world consequence.
**Recommendation**: Explain the best solution.
**Example Fix**:
```code
corrected code
```
**Best Practice**: Reference standard (OWASP, CWE, etc.)

For correct areas:
| Area | ✅ Correct | Why |

When done, write the report to `c:\Users\tuf\Desktop\systemAI bot\.agents\explorer_frontend\handoff.md` and send a message back to parent.
