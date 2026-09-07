# Security Policy

## Reporting Security Issues

We take the security and privacy of **GUIDE ME** users with utmost seriousness. If you believe you have discovered a vulnerability, please do NOT create a public GitHub issue.

Please report vulnerabilities privately to:
`security@guideme-health.internal`

Include:
- Type of vulnerability (e.g. IDOR, Authentication bypass, Token leakage)
- Step-by-step reproduction steps or proof-of-concept
- Affected API endpoint or frontend component

## Security Architecture & Defenses

1. **Zero Secret Storage**: Secrets, JWT keys, and third-party credentials are managed exclusively through environment variables.
2. **Strict Insecure Direct Object Reference (IDOR) Protection**: All repository queries enforce explicit ownership scoping (`user_id == current_user.id`).
3. **Password Security**: Passwords are encrypted with native bcrypt (12 rounds) with minimum complexity enforcement. Hashes are never returned through APIs.
4. **Camera & Biometric Privacy**: Video frames captured via `navigator.mediaDevices.getUserMedia()` are processed strictly in-memory (RAM) and immediately discarded. Raw videos and facial photos are NEVER saved to disk or database.
5. **Session Safety**: Signed JWT tokens with short-lived access tokens and refresh token rotation.
6. **Audit Trail**: Sensitive actions (logins, consent modifications, data exports, safety triggers) generate immutable audit logs.
