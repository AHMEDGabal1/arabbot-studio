# Security Policy 🛡️

ArabBot Studio takes security seriously. We appreciate your efforts to responsibly disclose security vulnerabilities.

---

## Supported Versions

Only the latest release and current `main` branch are actively supported for security updates:

| Version | Supported          |
| ------- | ------------------ |
| Main (`main`) | :white_check_mark: |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

---

## Reporting a Vulnerability

**Do NOT report security vulnerabilities through public GitHub issues.**

If you discover a security vulnerability in ArabBot Studio, please report it privately:

1. **Email**: Send details of the issue to `security@arabbot.studio`.
2. **Details**: Include:
   - Type of vulnerability (e.g. SQL Injection, Webhook Bypassing, JWT weakness)
   - Step-by-step instructions or PoC script to reproduce
   - Impact assessment
3. **Response Time**: We aim to acknowledge receipt of vulnerability reports within 24–48 hours and provide a timeline for remediation.

---

## Security Practices in ArabBot Studio

ArabBot Studio incorporates built-in security protections:
- **HMAC-SHA256 Timing-Safe Verification** for Meta/WhatsApp webhooks
- **JWT Authentication** with workspace isolation enforcement
- **FAISS Vector Index Validation** against negative bounds / arbitrary memory access
- **Monthly Message Quotas** & Rate Limiting per workspace
- **UUID Format Sanitization** to prevent SQL injection & path traversal
